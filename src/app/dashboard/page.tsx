'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [configMissing, setConfigMissing] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            checkConfig();
        }
    }, [status]);

    const checkConfig = async () => {
        try {
            const response = await fetch('/api/auth/config');
            const data = await response.json();
            if (data.success && (!data.data.whatsappPhoneId || !data.data.whatsappToken)) {
                setConfigMissing(true);
            }
        } catch (error) {
            console.error('Error checking config:', error);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        router.push('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">R</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">RENOVA</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/setup')}
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Configuración
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                            <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {configMissing && (
                    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-2xl">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="text-amber-900 font-semibold">Configuración pendiente</h3>
                                <p className="text-amber-700 text-sm">Aún no has conectado RENOVA con WhatsApp. Configura tus tokens para empezar a recibir mensajes.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/setup')}
                            className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-sm"
                        >
                            Configurar ahora
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Conversaciones Recientes</h2>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Próximamente</span>
                            </div>
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl text-gray-300">💬</span>
                                </div>
                                <h3 className="text-gray-900 font-semibold mb-1">No hay conversaciones aún</h3>
                                <p className="text-gray-500 text-sm max-w-sm mx-auto">Las conversaciones aparecerán aquí una vez que conectes WhatsApp y recibas tu primer mensaje.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Próximas Renovaciones</h2>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-gray-50 text-center text-gray-400 text-sm">
                                    Aún no hay renovaciones programadas
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white text-center">
                            <h3 className="text-lg font-bold mb-2">✅ Fase 1 & 2 en curso</h3>
                            <p className="text-blue-100 text-sm mb-4">La infraestructura base y la integración con WhatsApp están listas.</p>
                            <div className="text-left space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    <span>Auth & DB (MVP)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    <span>WhatsApp Webhook</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    <span>WhatsApp API Utility</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
