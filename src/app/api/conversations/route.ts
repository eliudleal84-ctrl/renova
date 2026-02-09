import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Client from '@/models/Client';
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
        // Las ordenamos por la última interacción (más reciente primero)
        const conversations = await Conversation.find({ userId: session.user.id })
            .populate('clientId')
            .sort({ lastMessageAt: -1 });

        return NextResponse.json<ApiResponse>({
            success: true,
            data: conversations,
        });
    } catch (error) {
        console.error('Error obteniendo conversaciones:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}
