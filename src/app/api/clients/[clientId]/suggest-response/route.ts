import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
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

        if (!session) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const { tone } = await request.json();

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        await connectDB();

        // 1. Obtener datos del cliente
        const client = await Client.findById(clientId);
        if (!client) {
            return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
        }

        // 2. Obtener los últimos mensajes para contexto
        const conversation = await Conversation.findOne({ clientId, userId: session.user.id });
        let contextMessages: any[] = [];
        if (conversation) {
            contextMessages = await Message.find({ conversationId: conversation._id })
                .sort({ timestamp: -1 })
                .limit(10)
                .lean();
            contextMessages.reverse(); // Ordenar cronológicamente
        }

        const contextString = contextMessages.map(m => `${m.direction === 'incoming' ? 'Cliente' : 'Yo'}: ${m.body}`).join('\n');

        // 3. Definir el prompt según el tono
        let toneInstructions = '';
        switch (tone) {
            case 'amable':
                toneInstructions = 'Usa un tono muy amable, empático y servicial. Usa emojis ocasionales.';
                break;
            case 'directo':
                toneInstructions = 'Sé profesional, directo y conciso. Evita rodeos.';
                break;
            case 'urgencia':
                toneInstructions = 'Crea una ligera sensación de urgencia o importancia, pero sin ser agresivo. Enfócate en la fecha de vencimiento.';
                break;
            case 'promocion':
                toneInstructions = 'Sé persuasivo y entusiasta. Destaca beneficios o una oferta especial para renovar.';
                break;
            default:
                toneInstructions = 'Mantén un tono profesional y equilibrado.';
        }

        const systemPrompt = `Eres un asistente experto en atención al cliente para RENOVA (una plataforma de gestión de renovaciones de servicios).
Tu objetivo es sugerir una respuesta para el canal de WhatsApp.

DATOS DEL CLIENTE:
- Nombre: ${client.name}
- Estado actual: ${client.status}
- Fecha de vencimiento: ${client.expirationDate ? client.expirationDate.toLocaleDateString() : 'No definida'}

INSTRUCCIONES DE TONO:
${toneInstructions}

CONTEXTO DE LA CONVERSACIÓN:
${contextString || 'No hay mensajes previos.'}

REGLAS DE ORO:
1. Responde solo con el texto del mensaje sugerido.
2. No uses placeholders como [Nombre]. Usa el nombre del cliente si es natural.
3. Sé breve (máximo 2 párrafos), ideal para WhatsApp.
4. Si el cliente tiene un servicio vencido, menciónalo sutilmente para incentivar la renovación.
5. El mensaje debe ser en Español.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Sugiere la mejor respuesta para continuar la conversación con este cliente." }
            ],
            temperature: 0.7,
            max_tokens: 250,
        });

        const suggestedResponse = completion.choices[0].message.content;

        return NextResponse.json({ success: true, data: suggestedResponse });

    } catch (error) {
        console.error('Error suggesting response:', error);
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
    }
}
