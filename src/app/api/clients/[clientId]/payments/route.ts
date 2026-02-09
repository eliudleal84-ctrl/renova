import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Payment from '@/models/Payment';

// GET: Obtener historial de pagos de un cliente
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        await connectDB();
        const payments = await Payment.find({
            clientId: clientId,
            userId: session.user.id
        }).sort({ paymentDate: -1 });

        return NextResponse.json({ success: true, data: payments });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}

// POST: Registrar un nuevo pago y actualizar vencimiento
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        const body = await request.json();
        const { amount, service, durationMonths, notes, paymentDate } = body;

        if (!amount || !service || !durationMonths) {
            return NextResponse.json({ success: false, error: 'Faltan datos obligatorios' }, { status: 400 });
        }

        await connectDB();

        const client = await Client.findById(clientId);
        if (!client) return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });

        // Calcular nueva fecha de vencimiento
        // Si el cliente ya tiene una fecha de vencimiento futura, sumamos a esa.
        // Si no tiene o ya venció, sumamos a partir de "Hoy" o de la fecha de pago.
        const baseDate = (client.expirationDate && new Date(client.expirationDate) > new Date())
            ? new Date(client.expirationDate)
            : new Date(paymentDate || Date.now());

        const newExpirationDate = new Date(baseDate);
        newExpirationDate.setMonth(newExpirationDate.getMonth() + parseInt(durationMonths));

        // 1. Crear el registro de pago
        const newPayment = await Payment.create({
            clientId,
            userId: session.user.id,
            amount: parseFloat(amount),
            service,
            durationMonths: parseInt(durationMonths),
            paymentDate: paymentDate || new Date(),
            newExpirationDate,
            notes
        });

        // 2. Actualizar el cliente
        client.expirationDate = newExpirationDate;
        client.status = 'Pagado'; // Actualizar estado automáticamente a Pagado
        await client.save();

        return NextResponse.json({ success: true, data: newPayment });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}
