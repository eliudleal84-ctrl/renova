import mongoose, { Schema, Document } from 'mongoose';

export interface IWhatsAppTemplate extends Document {
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    components: Array<{
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
        text?: string;
        format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
        buttons?: Array<{
            type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
            text: string;
            url?: string;
            phoneNumber?: string;
        }>;
    }>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    variables: string[]; // List of variables like {{1}}, {{2}} found in the template
    userId: mongoose.Types.ObjectId;
}

const WhatsAppTemplateSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    language: { type: String, required: true, default: 'es' },
    category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], required: true },
    components: [{
        type: { type: String, enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'], required: true },
        text: { type: String },
        format: { type: String, enum: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] },
        buttons: [{
            type: { type: String, enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'] },
            text: { type: String },
            url: { type: String },
            phoneNumber: { type: String }
        }]
    }],
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    variables: [{ type: String }],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.models.WhatsAppTemplate || mongoose.model<IWhatsAppTemplate>('WhatsAppTemplate', WhatsAppTemplateSchema);
