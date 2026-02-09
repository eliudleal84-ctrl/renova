import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;

interface TemplateOption {
    name: string;
    languageCode: string;
    components?: any[];
}

interface SendMessageOptions {
    accessToken: string;
    phoneId: string;
    to: string;
    text?: string;
    template?: TemplateOption;
}

export const sendWhatsAppMessage = async ({
    accessToken,
    phoneId,
    to,
    text,
    template,
}: SendMessageOptions) => {
    try {
        const payload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
        };

        if (template) {
            payload.type = 'template';
            payload.template = {
                name: template.name,
                language: {
                    code: template.languageCode,
                },
                components: template.components,
            };
        } else if (text) {
            payload.type = 'text';
            payload.text = { body: text };
        } else {
            throw new Error('Debe proporcionar texto o una plantilla.');
        }

        const response = await axios.post(
            `${WHATSAPP_API_URL}/${phoneId}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            success: true,
            messageId: response.data.messages[0].id,
            data: response.data,
        };
    } catch (error: any) {
        console.error('Error enviando mensaje de WhatsApp:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
        };
    }
};

export const markMessageAsRead = async (
    accessToken: string,
    phoneId: string,
    messageId: string
) => {
    try {
        await axios.post(
            `${WHATSAPP_API_URL}/${phoneId}/messages`,
            {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return { success: true };
    } catch (error: any) {
        console.error('Error marcando mensaje como leído:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};
