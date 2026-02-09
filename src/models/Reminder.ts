import mongoose, { Schema, Model } from 'mongoose';

export type ReminderType = 'cobrar' | 'seguimiento' | 'renovar';

export interface IReminder {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    type: ReminderType;
    dueDate: Date;
    description?: string;
    completed: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        clientId: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['cobrar', 'seguimiento', 'renovar'],
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
            index: true,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Índice compuesto para obtener recordatorios pendientes ordenados por fecha
ReminderSchema.index({ userId: 1, dueDate: 1, completed: 1 });

const Reminder: Model<IReminder> =
    mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderSchema);

export default Reminder;
