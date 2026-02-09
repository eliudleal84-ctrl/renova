import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json();

        // Validación básica
        if (!email || !password || !name) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Todos los campos son requeridos',
                },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres',
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: 'Este email ya está registrado',
                },
                { status: 400 }
            );
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
        });

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: 'Usuario creado exitosamente',
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error en registro:', error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: 'Error al crear el usuario',
            },
            { status: 500 }
        );
    }
}
