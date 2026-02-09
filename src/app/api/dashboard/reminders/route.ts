import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
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

        // Obtenemos la fecha actual y la fecha dentro de 30 días
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        // Buscamos clientes del usuario que venzan pronto o hayan vencido recientemente (últimos 7 días)
        const aWeekAgo = new Date();
        aWeekAgo.setDate(now.getDate() - 7);

        const clients = await Client.find({
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
            .lean();

        return NextResponse.json<ApiResponse>({
            success: true,
            data: clients,
        });
    } catch (error: any) {
        console.error('Error obteniendo recordatorios:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Error del servidor' },
            { status: 500 }
        );
    }
}
