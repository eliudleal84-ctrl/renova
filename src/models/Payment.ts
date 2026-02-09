import mongoose, { Schema, Model } from 'mongoose';

export interface IPayment {
    _id: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    amount: number;
    service: string; // e.g., "Plan Familiar", "Screen 1 month"
    durationMonths: number;
    paymentDate: Date;
    newExpirationDate: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        clientId: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        service: {
            type: String,
            required: true,
            trim: true,
        },
        durationMonths: {
            type: Number,
            required: true,
            default: 1
        },
        paymentDate: {
            type: Date,
            default: Date.now,
        },
        newExpirationDate: {
            type: Date,
            required: true,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
