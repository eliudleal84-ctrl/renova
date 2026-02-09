import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Reminder from '@/models/Reminder';
import { ApiResponse } from '@/types';

// GET: Obtener recordatorios de un cliente
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        await connectDB();
        const reminders = await Reminder.find({
            clientId: clientId,
            userId: session.user.id
        }).sort({ dueDate: 1 });

        return NextResponse.json({ success: true, data: reminders });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}

// POST: Crear un nuevo recordatorio manual
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        const { type, dueDate, description } = await request.json();

        await connectDB();
        const newReminder = await Reminder.create({
            userId: session.user.id,
            clientId: clientId,
            type,
            dueDate: new Date(dueDate),
            description,
            completed: false
        });

        return NextResponse.json({ success: true, data: newReminder });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}
