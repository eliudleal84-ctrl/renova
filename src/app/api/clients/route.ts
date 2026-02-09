import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, phoneNumber } = body;

        if (!phoneNumber) {
            return NextResponse.json({ success: false, error: 'Número de teléfono es obligatorio' }, { status: 400 });
        }

        await connectDB();

        // Verificar si ya existe el cliente para este usuario
        const existingClient = await Client.findOne({
            phoneNumber: phoneNumber.replace(/\D/g, ''),
            userId: session.user.id
        });

        if (existingClient) {
            return NextResponse.json({ success: false, error: 'El cliente ya existe' }, { status: 400 });
        }

        const newClient = await Client.create({
            name,
            phoneNumber: phoneNumber.replace(/\D/g, ''),
            userId: session.user.id,
            status: 'Nuevo'
        });

        return NextResponse.json({ success: true, data: newClient });
    } catch (error) {
        console.error('Error in POST /api/clients:', error);
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
    }
}
