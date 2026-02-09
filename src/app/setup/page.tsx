'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SetupPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        whatsappPhoneId: '',
        whatsappToken: '',
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchConfig();
        }
    }, [status, router]);

    const fetchConfig = async () => {
        try {
            const response = await fetch('/api/auth/config');
            const data = await response.json();
            if (data.success && data.data) {
                setFormData({
                    whatsappPhoneId: data.data.whatsappPhoneId || '',
                    whatsappToken: data.data.whatsappToken || '',
                });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('✅ Configuración guardada correctamente.');
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                setMessage('❌ Error: ' + data.error);
            }
        } catch (err) {
            setMessage('❌ Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Configuración de WhatsApp
                </h1>

                <p className="text-sm text-gray-600 mb-8 text-center">
                    Para conectar RENOVA con tu cuenta de WhatsApp Business, ingresa los datos de tu aplicación en Meta Developers.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            WhatsApp Phone Number ID
                        </label>
                        <input
                            type="text"
                            value={formData.whatsappPhoneId}
                            onChange={(e) =>
                                setFormData({ ...formData, whatsappPhoneId: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: 10654877..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            WhatsApp Access Token (Permanente)
                        </label>
                        <textarea
                            value={formData.whatsappToken}
                            onChange={(e) =>
                                setFormData({ ...formData, whatsappToken: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                            placeholder="EAAGz..."
                            required
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">Tu Webhook URL:</h3>
                        <code className="text-xs break-all text-blue-800">
                            {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : 'Cargando...'}
                        </code>
                        <p className="mt-2 text-xs text-blue-700">
                            Usa esta URL en el panel de Meta para configurar el Webhook.
                            El Verify Token es el que definiste en tu .env (o solicita al admin).
                        </p>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {loading ? 'Guardando...' : 'Guardar y Continuar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
