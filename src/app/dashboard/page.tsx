'use client';
// Build trigger: AI Summary integration v1.1

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConversationWithClient, IClient, IReminder, ReminderWithClient } from '@/types';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [configMissing, setConfigMissing] = useState(false);
    const [conversations, setConversations] = useState<ConversationWithClient[]>([]);
    const [reminderData, setReminderData] = useState<{ expiringClients: IClient[], manualReminders: ReminderWithClient[] }>({ expiringClients: [], manualReminders: [] });
    const [loadingConv, setLoadingConv] = useState(true);
    const [loadingReminders, setLoadingReminders] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            checkConfig();
            fetchConversations();
            fetchReminders();

            // Auto-actualizar cada 30 segundos
            const interval = setInterval(() => {
                fetchConversations();
                fetchReminders();
            }, 30000);
            return () => clearInterval(interval);
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

    const fetchConversations = async (manual = false) => {
        if (manual) setLoadingConv(true);
        try {
            const response = await fetch('/api/conversations');
            const data = await response.json();
            if (data.success) {
                setConversations(data.data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoadingConv(false);
        }
    };

    const fetchReminders = async () => {
        try {
            const response = await fetch('/api/dashboard/reminders');
            const data = await response.json();
            if (data.success) {
                setReminderData(data.data);
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setLoadingReminders(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
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
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
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
                            <span className="text-sm font-medium text-gray-700">{session.user?.name}</span>
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
                    <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna Principal: Conversaciones */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900">Conversaciones Recientes</h2>
                                <button
                                    onClick={() => fetchConversations(true)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Actualizar
                                </button>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {loadingConv ? (
                                    <div className="p-12 text-center text-gray-400">Cargando conversaciones...</div>
                                ) : conversations.length > 0 ? (
                                    conversations.map((conv) => (
                                        <Link
                                            key={conv._id.toString()}
                                            href={`/dashboard/client/${conv.clientId?._id?.toString() || ''}`}
                                            className="block p-6 hover:bg-blue-50/50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                                                        {(conv.clientId?.name || 'C')[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{conv.clientId?.name || conv.phoneNumber}</h4>
                                                        <p className="text-sm text-gray-500">{conv.phoneNumber}</p>
                                                        <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conv.clientId?.status === 'Nuevo' ? 'bg-green-600 text-white' :
                                                            conv.clientId?.status === 'Interesado' ? 'bg-blue-600 text-white' :
                                                                conv.clientId?.status === 'Pagado' ? 'bg-emerald-600 text-white' :
                                                                    conv.clientId?.status === 'Renovación' ? 'bg-orange-600 text-white' :
                                                                        'bg-gray-600 text-white'
                                                            }`}>
                                                            {conv.clientId?.status || 'Nuevo'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="inline-flex mt-1 items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-4xl text-gray-300">💬</span>
                                        </div>
                                        <h3 className="text-gray-900 font-semibold mb-1">No hay conversaciones aún</h3>
                                        <p className="text-gray-500 text-sm max-w-sm mx-auto">Las conversaciones aparecerán aquí una vez que conectes WhatsApp y recibas tu primer mensaje.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Lateral */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>📅</span> Próximas Renovaciones
                            </h2>
                            <div className="space-y-4">
                                {loadingReminders ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">Cargando...</div>
                                ) : reminderData.expiringClients?.length > 0 ? (
                                    reminderData.expiringClients.map((client) => {
                                        const isOverdue = client.expirationDate && new Date(client.expirationDate) < new Date();
                                        return (
                                            <Link
                                                key={client._id.toString()}
                                                href={`/dashboard/client/${client._id.toString()}`}
                                                className={`block p-4 rounded-xl border transition-all hover:shadow-md ${isOverdue
                                                    ? 'bg-red-50 border-red-100 hover:bg-red-100'
                                                    : 'bg-gray-50 border-gray-100 hover:bg-blue-50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                                                        {isOverdue ? '❌ Vencido' : '⏳ Por vencer'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                        {client.expirationDate ? new Date(client.expirationDate).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-900 truncate">
                                                    {client.name || client.phoneNumber}
                                                </h4>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 rounded-xl bg-gray-50 text-center text-gray-400 text-sm border border-dashed border-gray-200">
                                        Aún no hay renovaciones programadas
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tareas Pendientes Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>✅</span> Tareas Pendientes
                            </h2>
                            <div className="space-y-4">
                                {loadingReminders ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">Cargando...</div>
                                ) : reminderData.manualReminders?.length > 0 ? (
                                    reminderData.manualReminders.map((rem: ReminderWithClient) => (
                                        <Link
                                            key={rem._id.toString()}
                                            href={`/dashboard/client/${rem.clientId?._id?.toString() || ''}`}
                                            className="block p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all hover:shadow-md"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${rem.type === 'cobrar' ? 'bg-red-100 text-red-600' :
                                                    rem.type === 'renovar' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {rem.type}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold">
                                                    {new Date(rem.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-1">{rem.description}</h4>
                                            <p className="text-[10px] text-gray-400 font-medium italic">
                                                Cliente: {rem.clientId?.name || 'Desconocido'}
                                            </p>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-4 rounded-xl bg-gray-50 text-center text-gray-400 text-sm border border-dashed border-gray-200">
                                        No hay tareas manuales pendientes
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🚀</div>
                            <h3 className="text-lg font-bold mb-2">Estado del Sistema</h3>
                            <p className="text-blue-100 text-sm mb-4">RENOVA está conectado y listo para procesar tus ventas.</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs bg-white/10 p-2 rounded-lg">
                                    <span>WhatsApp Cloud API</span>
                                    <span className="text-green-300 font-bold">ACTIVO</span>
                                </div>
                                <div className="flex items-center justify-between text-xs bg-white/10 p-2 rounded-lg">
                                    <span>Base de Datos</span>
                                    <span className="text-green-300 font-bold">ONLINE</span>
                                </div>
                                <div className="flex items-center justify-between text-xs bg-white/10 p-2 rounded-lg">
                                    <span>Sincronización</span>
                                    <span className="text-blue-200">TIEMPO REAL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
