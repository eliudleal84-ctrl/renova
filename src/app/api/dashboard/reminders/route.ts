import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Reminder from '@/models/Reminder';
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

        const now = new Date();
        const aWeekAgo = new Date();
        aWeekAgo.setDate(now.getDate() - 7);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        const [clients, manualReminders] = await Promise.all([
            Client.find({
                userId: session.user.id,
                expirationDate: {
                    $exists: true,
                    $ne: null,
                    $gte: aWeekAgo,
                    $lte: thirtyDaysFromNow
                }
            })
                .sort({ expirationDate: 1 })
                .limit(10)
                .lean(),

            Reminder.find({
                userId: session.user.id,
                completed: false
            })
                .populate('clientId', 'name phoneNumber')
                .sort({ dueDate: 1 })
                .limit(10)
                .lean()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                expiringClients: clients,
                manualReminders: manualReminders
            },
        });
    } catch (error: any) {
        console.error('Error obteniendo recordatorios:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}
