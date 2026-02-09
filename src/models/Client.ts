import mongoose, { Schema, Model } from 'mongoose';

export type ClientStatus = 'Nuevo' | 'Interesado' | 'Pagado' | 'Renovación' | 'Perdido' | 'Próximamente' | 'Cancelado';

export interface IClient {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    phoneNumber: string;
    name: string;
    status: ClientStatus;
    notes?: string;
    lastInteraction: Date;
    expirationDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            required: [true, 'El número de teléfono es requerido'],
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['Nuevo', 'Interesado', 'Pagado', 'Renovación', 'Perdido', 'Próximamente', 'Cancelado'],
            default: 'Nuevo',
            index: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        lastInteraction: {
            type: Date,
            default: Date.now,
            index: true,
        },
        expirationDate: {
            type: Date,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Índice compuesto único: un número de teléfono por usuario
ClientSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });

const Client: Model<IClient> = mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default Client;
