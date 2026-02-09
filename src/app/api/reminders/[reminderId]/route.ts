import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Reminder from '@/models/Reminder';
import { ApiResponse } from '@/types';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ reminderId: string }> }
) {
    try {
        const { reminderId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        const { completed } = await request.json();

        await connectDB();
        const reminder = await Reminder.findOneAndUpdate(
            { _id: reminderId, userId: session.user.id },
            {
                $set: {
                    completed,
                    completedAt: completed ? new Date() : null
                }
            },
            { new: true }
        );

        if (!reminder) return NextResponse.json({ success: false, error: 'Recordatorio no encontrado' }, { status: 404 });

        return NextResponse.json({ success: true, data: reminder });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ reminderId: string }> }
) {
    try {
        const { reminderId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        await connectDB();
        const result = await Reminder.deleteOne({ _id: reminderId, userId: session.user.id });

        if (result.deletedCount === 0) return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}
