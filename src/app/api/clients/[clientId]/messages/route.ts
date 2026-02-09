import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Client from '@/models/Client';
import Message from '@/models/Message';
import User from '@/models/User';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { ApiResponse } from '@/types';

// GET: Obtener mensajes de una conversación basada en el clientId
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        await connectDB();
        const conversation = await Conversation.findOne({
            clientId: clientId,
            userId: session.user.id
        });

        if (!conversation) {
            return NextResponse.json({ success: true, data: [] });
        }

        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ timestamp: 1 });

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}

// POST: Enviar un mensaje de respuesta
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        const { body: messageText, templateName, templateComponents, templateLanguage } = await request.json();
        if (!messageText && !templateName) return NextResponse.json({ success: false, error: 'Mensaje vacío o sin plantilla' }, { status: 400 });

        await connectDB();

        // 1. Obtener datos del usuario (token y phone ID)
        const user = await User.findById(session.user.id);
        if (!user || !user.whatsappToken || !user.whatsappPhoneId) {
            return NextResponse.json({ success: false, error: 'Configuración de WhatsApp incompleta' }, { status: 400 });
        }

        // 2. Obtener la conversación y el número del cliente
        let conversation = await Conversation.findOne({
            clientId: clientId,
            userId: session.user.id
        });

        const client = await Client.findById(clientId);
        if (!client) return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });

        if (!conversation) {
            // Crear conversación si no existe (para clientes agregados manualmente)
            conversation = await Conversation.create({
                userId: session.user.id,
                clientId: client._id,
                phoneNumber: client.phoneNumber,
                lastMessageAt: new Date(),
                unreadCount: 0
            });
        }

        // 3. Enviar vía WhatsApp Cloud API
        // Limpiar el número: quitar el '1' extra en números de México (521... -> 52...)
        let cleanPhone = client.phoneNumber.replace(/\D/g, '');
        if (cleanPhone.startsWith('521') && cleanPhone.length === 13) {
            cleanPhone = '52' + cleanPhone.substring(3);
        }

        const waResult = await sendWhatsAppMessage({
            accessToken: user.whatsappToken,
            phoneId: user.whatsappPhoneId,
            to: cleanPhone,
            text: messageText,
            template: templateName ? {
                name: templateName,
                languageCode: templateLanguage || 'es',
                components: templateComponents
            } : undefined
        });

        if (!waResult.success) {
            console.error('Error detallado de WhatsApp:', JSON.stringify(waResult.error, null, 2));
            return NextResponse.json({ success: false, error: 'Error al enviar por WhatsApp', details: waResult.error }, { status: 500 });
        }

        // 4. Guardar en la base de datos
        // Si es plantilla, el cuerpo del mensaje guardado debe ser descriptivo
        const finalBody = messageText || `[Plantilla: ${templateName}]`;

        const newMessage = await Message.create({
            conversationId: conversation._id,
            userId: session.user.id,
            messageId: waResult.messageId,
            from: user.whatsappPhoneId, // Nuestro ID
            to: conversation.phoneNumber,
            body: finalBody,
            timestamp: new Date(),
            direction: 'outgoing',
            status: 'sent'
        });

        // 5. Actualizar última interacción en la conversación
        conversation.lastMessageAt = newMessage.timestamp;
        conversation.unreadCount = 0; // Resetear contador al responder
        await conversation.save();

        return NextResponse.json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}
