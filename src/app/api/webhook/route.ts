import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';

// GET: Verificación del webhook por Meta
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse(null, { status: 403 });
        }
    }

    return new NextResponse(null, { status: 400 });
}

// POST: Recepción de mensajes de WhatsApp
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar que es un evento de WhatsApp
        if (body.object !== 'whatsapp_business_account') {
            return NextResponse.json({ error: 'Not a WhatsApp event' }, { status: 404 });
        }

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];
        const metadata = value?.metadata;

        if (!message || !metadata) {
            // Puede ser un cambio de estado (sent, delivered, read)
            // Por ahora ignoramos los estados para el MVP simplificado
            return NextResponse.json({ success: true, message: 'Status update ignored' });
        }

        const phoneId = metadata.phone_number_id;
        const clientPhone = message.from;
        const messageBody = message.text?.body || '';
        const messageId = message.id;
        const timestamp = new Date(parseInt(message.timestamp) * 1000);

        await connectDB();

        // 1. Buscar al usuario dueño de este Phone ID
        const user = await User.findOne({ whatsappPhoneId: phoneId });
        if (!user) {
            console.error(`Usuario no encontrado para Phone ID: ${phoneId}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Buscar o crear el cliente
        let client = await Client.findOne({ userId: user._id, phoneNumber: clientPhone });
        if (!client) {
            client = await Client.create({
                userId: user._id,
                phoneNumber: clientPhone,
                name: clientPhone, // Por ahora el número, el usuario lo puede editar
                status: 'Nuevo',
                lastInteraction: timestamp,
            });
        } else {
            client.lastInteraction = timestamp;
            await client.save();
        }

        // 3. Buscar o crear la conversación
        let conversation = await Conversation.findOne({ userId: user._id, clientId: client._id });
        if (!conversation) {
            conversation = await Conversation.create({
                userId: user._id,
                clientId: client._id,
                phoneNumber: clientPhone,
                lastMessageAt: timestamp,
                unreadCount: 1,
            });
        } else {
            conversation.lastMessageAt = timestamp;
            conversation.unreadCount += 1;
            await conversation.save();
        }

        // 4. Guardar el mensaje
        await Message.create({
            conversationId: conversation._id,
            userId: user._id,
            messageId: messageId,
            from: clientPhone,
            to: metadata.display_phone_number,
            body: messageBody,
            timestamp: timestamp,
            direction: 'incoming',
            status: 'delivered', // Como nos llegó, está entregado
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error en webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
