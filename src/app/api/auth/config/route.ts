import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ApiResponse } from '@/types';

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { whatsappPhoneId, whatsappToken } = await request.json();

        if (!whatsappPhoneId || !whatsappToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Datos incompletos' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findByIdAndUpdate(
            session.user.id,
            {
                whatsappPhoneId,
                whatsappToken,
            },
            { new: true }
        );

        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Configuración actualizada correctamente',
            data: {
                whatsappPhoneId: user.whatsappPhoneId,
            },
        });
    } catch (error) {
        console.error('Error actualizando configuración:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}

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
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                whatsappPhoneId: user.whatsappPhoneId || '',
                whatsappToken: user.whatsappToken || '',
            },
        });
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}
