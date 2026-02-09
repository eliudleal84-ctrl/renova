import mongoose, { Schema, Model } from 'mongoose';

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface IMessage {
    _id: mongoose.Types.ObjectId;
    conversationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    messageId: string;
    from: string;
    to: string;
    body: string;
    timestamp: Date;
    direction: MessageDirection;
    status: MessageStatus;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        messageId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        from: {
            type: String,
            required: true,
            trim: true,
        },
        to: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
            index: true,
        },
        direction: {
            type: String,
            enum: ['incoming', 'outgoing'],
            required: true,
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read', 'failed'],
            default: 'sent',
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Índice para obtener mensajes de una conversación ordenados por fecha
MessageSchema.index({ conversationId: 1, timestamp: -1 });

const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
