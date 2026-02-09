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

        // Obtener todas las conversaciones del usuario, incluyendo los datos del cliente
        const conversations = await Conversation.find({ userId: session.user.id })
            .populate({
                path: 'clientId',
                model: Client
            })
            .sort({ lastMessageAt: -1 })
            .lean();

        return NextResponse.json<ApiResponse>({
            success: true,
            data: conversations,
        });
    } catch (error: any) {
        console.error('Error obteniendo conversaciones:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}
