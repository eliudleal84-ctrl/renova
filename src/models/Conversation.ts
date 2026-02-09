import mongoose, { Schema, Model } from 'mongoose';

export interface IConversation {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    phoneNumber: string;
    lastMessageAt: Date;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
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
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        unreadCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Índice compuesto único: una conversación por cliente
ConversationSchema.index({ userId: 1, clientId: 1 }, { unique: true });

// Índice para ordenar por última actividad
ConversationSchema.index({ userId: 1, lastMessageAt: -1 });

const Conversation: Model<IConversation> =
    mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
