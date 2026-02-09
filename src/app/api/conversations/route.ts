import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
    let step = 'inicio';
    try {
        step = 'obteniendo sesión';
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'No autorizado - No hay sesión' },
                { status: 401 }
            );
        }

        if (!session.user.id) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'ID de usuario no encontrado en la sesión' },
                { status: 400 }
            );
        }

        step = 'conectando a db';
        await connectDB();

        // Obtener todas las conversaciones del usuario, incluyendo los datos del cliente
        // Aseguramos que el modelo Client esté registrado usándolo explícitamente en el populate
        step = 'buscando conversaciones';
        const query = { userId: session.user.id };

        const conversations = await Conversation.find(query)
            /* .populate({
                path: 'clientId',
                model: Client
            }) */
            .sort({ lastMessageAt: -1 })
            .lean();

        step = 'finalizando';

        return NextResponse.json<ApiResponse>({
            success: true,
            data: conversations,
        });
    } catch (error: any) {
        console.error(`Error en ${step}:`, error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: `Error del servidor en ${step}: ` + (error.message || 'Error desconocido') },
            { status: 500 }
        );
    }
}
