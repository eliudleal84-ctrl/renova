import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            );
        }

        await connectDB();

        // 1. Obtener todos los clientes del usuario
        const allClients = await Client.find({ userId: session.user.id }).lean();

        // 2. Obtener todas las conversaciones
        const conversations = await Conversation.find({ userId: session.user.id })
            .populate({
                path: 'clientId',
                model: Client
            })
            .sort({ lastMessageAt: -1 })
            .lean();

        // 3. Crear una lista unificada
        // Primero las conversaciones existentes
        const unifiedList: any[] = [...conversations];

        // Añadir clientes que NO tienen una conversación aún
        const conversationClientIds = conversations.map(c => c.clientId?._id?.toString());

        allClients.forEach(client => {
            if (!conversationClientIds.includes(client._id.toString())) {
                unifiedList.push({
                    _id: `temp-${client._id}`,
                    clientId: client,
                    userId: session.user.id,
                    phoneNumber: client.phoneNumber,
                    lastMessageAt: client.createdAt,
                    unreadCount: 0,
                    isPlaceholder: true
                });
            }
        });

        // Re-ordenar por fecha (conversaciones reales primero por lastMessageAt, luego clientes nuevos por createdAt)
        unifiedList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

        return NextResponse.json<ApiResponse>({
            success: true,
            data: unifiedList,
        });
    } catch (error: any) {
        console.error('Error obteniendo conversaciones:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}
