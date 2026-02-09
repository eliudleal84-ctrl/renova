import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import WhatsAppTemplate from '@/models/WhatsAppTemplate';
import { authOptions } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const { templateId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const deleted = await WhatsAppTemplate.findOneAndDelete({
            _id: templateId,
            userId: session.user.id
        });

        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ templateId: string }> }
) {
    try {
        const { templateId } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        await connectDB();

        const updated = await WhatsAppTemplate.findOneAndUpdate(
            { _id: templateId, userId: session.user.id },
            { ...body },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
