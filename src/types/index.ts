import { IUser } from '@/models/User';
import { IClient, ClientStatus } from '@/models/Client';
import { IConversation } from '@/models/Conversation';
import { IMessage, MessageDirection, MessageStatus } from '@/models/Message';
import { IReminder, ReminderType } from '@/models/Reminder';

// Re-export model interfaces
export type {
    IUser,
    IClient,
    IConversation,
    IMessage,
    IReminder,
    ClientStatus,
    MessageDirection,
    MessageStatus,
    ReminderType,
};

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Client with populated conversation
export interface ClientWithConversation extends IClient {
    conversation?: IConversation;
    lastMessage?: string;
}

// Conversation with client details (populated)
export interface ConversationWithClient extends Omit<IConversation, 'clientId'> {
    clientId: IClient;
}

// Message list response
export interface MessageListResponse {
    messages: IMessage[];
    hasMore: boolean;
    total: number;
}

// Reminder with client details (populated)
export interface ReminderWithClient extends Omit<IReminder, 'clientId'> {
    clientId: IClient;
}

// AI Summary response
export interface AISummaryResponse {
    summary: string;
    intent: string;
    suggestedAction: string;
}

// WhatsApp webhook types
export interface WhatsAppWebhookMessage {
    from: string;
    id: string;
    timestamp: string;
    text?: {
        body: string;
    };
    type: string;
}

export interface WhatsAppWebhookEntry {
    id: string;
    changes: Array<{
        value: {
            messaging_product: string;
            metadata: {
                display_phone_number: string;
                phone_number_id: string;
            };
            messages?: WhatsAppWebhookMessage[];
            statuses?: Array<{
                id: string;
                status: string;
                timestamp: string;
                recipient_id: string;
            }>;
        };
        field: string;
    }>;
}

export interface WhatsAppWebhookPayload {
    object: string;
    entry: WhatsAppWebhookEntry[];
}
