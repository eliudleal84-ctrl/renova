import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import OpenAI from 'openai';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ success: false, error: 'OpenAI API Key no configurada' }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        await connectDB();

        // 1. Encontrar la conversación para este cliente
        const conversation = await Conversation.findOne({
            userId: session.user.id,
            clientId: clientId
        }).lean();

        if (!conversation) {
            return NextResponse.json({ success: false, error: 'Conversación no encontrada' }, { status: 404 });
        }

        // 2. Obtener los últimos 20 mensajes de esta conversación específica
        const relevantMessages = await Message.find({
            conversationId: conversation._id,
            userId: session.user.id
        })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

        if (relevantMessages.length === 0) {
            return NextResponse.json({ success: false, error: 'No hay mensajes para resumir' }, { status: 400 });
        }

        // 2. Preparar el prompt para OpenAI
        const chatContext = relevantMessages
            .reverse() // Poner en orden cronológico
            .map(m => `${m.direction === 'incoming' ? 'Cliente' : 'Vendedor'}: ${m.body}`)
            .join('\n');

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Eres un asistente experto en ventas y CRM. Tu tarea es resumir una conversación de WhatsApp entre un vendedor y un cliente. Identifica: 1) El interés principal del cliente, 2) El estado de la negociación, 3) Próximos pasos sugeridos. Responde de forma concisa en español, usando viñetas."
                },
                {
                    role: "user",
                    content: `Por favor resume esta conversación:\n\n${chatContext}`
                }
            ],
            temperature: 0.7,
            max_tokens: 300,
        });

        const summary = completion.choices[0].message.content;

        return NextResponse.json({
            success: true,
            data: { summary }
        });
    } catch (error: any) {
        console.error('Error generando resumen con IA:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al generar resumen: ' + error.message
        }, { status: 500 });
    }
}
