import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Payment from '@/models/Payment';

// PUT: Editar un pago existente
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string; paymentId: string }> }
) {
    try {
        const { clientId, paymentId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        const body = await request.json();
        const { amount, service, notes, paymentDate } = body;

        await connectDB();

        const updatedPayment = await Payment.findOneAndUpdate(
            { _id: paymentId, clientId: clientId, userId: session.user.id },
            {
                amount: amount ? parseFloat(amount) : undefined,
                service,
                notes,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined
            },
            { new: true }
        );

        if (!updatedPayment) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });

        return NextResponse.json({ success: true, data: updatedPayment });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}

// DELETE: Eliminar un pago y opcionalmente revertir fecha
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ clientId: string; paymentId: string }> }
) {
    try {
        const { clientId, paymentId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

        await connectDB();

        // 1. Encontrar el pago antes de borrarlo
        const paymentToDelete = await Payment.findOne({ _id: paymentId, clientId: clientId, userId: session.user.id });
        if (!paymentToDelete) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });

        // 2. Borrarlo
        await Payment.findByIdAndDelete(paymentId);

        // 3. Reajustar la fecha del cliente si era el pago más reciente
        // Buscamos el pago más reciente que quede
        const lastPayment = await Payment.findOne({ clientId: clientId, userId: session.user.id }).sort({ paymentDate: -1, createdAt: -1 });

        const client = await Client.findById(clientId);
        if (client) {
            if (lastPayment) {
                // Si queda algún pago, ponemos la fecha de vencimiento de ese pago
                client.expirationDate = lastPayment.newExpirationDate;
            } else {
                // Si no quedan pagos, reseteamos la fecha a null (valor inicial)
                client.expirationDate = null as any;
                client.status = 'Nuevo';
            }
            await client.save();
        }

        return NextResponse.json({ success: true, message: 'Pago eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}
