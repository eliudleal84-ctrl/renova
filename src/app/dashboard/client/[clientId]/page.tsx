'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { use } from 'react';
import { IClient, IMessage, IReminder } from '@/types';

export default function ClientDetailPage({ params: paramsPromise }: { params: Promise<{ clientId: string }> }) {
    const params = use(paramsPromise);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [client, setClient] = useState<IClient | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [reminders, setReminders] = useState<IReminder[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [newReminder, setNewReminder] = useState({ type: 'seguimiento', dueDate: '', description: '' });
    const [darkMode, setDarkMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated' && params.clientId) {
            fetchData();
            const interval = setInterval(fetchMessages, 5000); // Polling cada 5 seg para ver mensajes nuevos
            return () => clearInterval(interval);
        }
    }, [status, params.clientId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientRes, messagesRes, remindersRes] = await Promise.all([
                fetch(`/api/clients/${params.clientId}`),
                fetch(`/api/clients/${params.clientId}/messages`),
                fetch(`/api/clients/${params.clientId}/reminders`)
            ]);
            const clientData = await clientRes.json();
            const messagesData = await messagesRes.json();
            const remindersData = await remindersRes.json();

            if (clientData.success) setClient(clientData.data);
            if (messagesData.success) setMessages(messagesData.data);
            if (remindersData.success) setReminders(remindersData.data);
        } catch (error) {
            console.error('Error fetching client data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/clients/${params.clientId}/messages`);
            const data = await res.json();
            if (data.success) setMessages(data.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchReminders = async () => {
        try {
            const res = await fetch(`/api/clients/${params.clientId}/reminders`);
            const data = await res.json();
            if (data.success) setReminders(data.data);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        }
    };

    const handleAddReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/clients/${params.clientId}/reminders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReminder)
            });
            const data = await res.json();
            if (data.success) {
                setShowReminderModal(false);
                setNewReminder({ type: 'seguimiento', dueDate: '', description: '' });
                fetchReminders();
            }
        } catch (error) {
            console.error('Error adding reminder:', error);
        }
    };

    const handleToggleReminder = async (reminderId: string, completed: boolean) => {
        try {
            const res = await fetch(`/api/reminders/${reminderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });
            const data = await res.json();
            if (data.success) fetchReminders();
        } catch (error) {
            console.error('Error toggling reminder:', error);
        }
    };

    const handleDeleteReminder = async (reminderId: string) => {
        if (!confirm('¿Eliminar este recordatorio?')) return;
        try {
            const res = await fetch(`/api/reminders/${reminderId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) fetchReminders();
        } catch (error) {
            console.error('Error deleting reminder:', error);
        }
    };

    const handleGenerateSummary = async () => {
        setSummarizing(true);
        setAiSummary('');
        try {
            const res = await fetch(`/api/clients/${params.clientId}/ai-summary`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                setAiSummary(data.data.summary);
            } else {
                alert('Error IA: ' + data.error);
            }
        } catch (error) {
            console.error('Error generating summary:', error);
        } finally {
            setSummarizing(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/clients/${params.clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) setClient(data.data);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/clients/${params.clientId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: newMessage })
            });
            const data = await res.json();
            if (data.success) {
                setNewMessage('');
                fetchMessages();
            } else {
                alert('Error al enviar: ' + (data.error || 'Desconocido'));
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
                <p className="text-gray-500 mb-4">No se encontró el cliente o no tienes acceso.</p>
                <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-bold">Volver al Dashboard</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 sticky top-0 z-10 shadow-sm transition-colors">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-blue-600 text-2xl">←</button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{client.name || client.phoneNumber}</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{client.phoneNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all shadow-inner"
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <select
                            value={client.status}
                            onChange={(e) => updateStatus(e.target.value)}
                            className="px-4 py-2 bg-blue-600 text-white border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 shadow-md cursor-pointer appearance-none"
                        >
                            <option value="Nuevo">NUEVO</option>
                            <option value="Interesado">INTERESADO</option>
                            <option value="Pagado">PAGADO</option>
                            <option value="Renovación">RENOVACIÓN</option>
                            <option value="Próximamente">PRÓXIMAMENTE</option>
                            <option value="Perdido">PERDIDO</option>
                            <option value="Cancelado">CANCELADO</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto bg-white dark:bg-slate-900 shadow-lg my-4 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg: IMessage) => (
                        <div
                            key={msg._id.toString()}
                            className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${msg.direction === 'outgoing'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-slate-700'
                                }`}>
                                <p className="text-sm leading-relaxed">{msg.body}</p>
                                <p className={`text-[10px] mt-1 opacity-70 ${msg.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95"
                    >
                        {sending ? '...' : 'Enviar'}
                    </button>
                </form>
            </div>

            {/* AI Summary Section */}
            <div className="max-w-5xl w-full mx-auto mb-8">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-900 dark:to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">✨</div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span>🤖</span> Resumen Inteligente (IA)
                            </h2>
                            <button
                                onClick={handleGenerateSummary}
                                disabled={summarizing}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold transition-all border border-white/30"
                            >
                                {summarizing ? 'Generando...' : 'Generar Nuevo Resumen'}
                            </button>
                        </div>

                        {aiSummary ? (
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="space-y-2">
                                    {aiSummary.split('\n').map((line, i) => (
                                        <p key={i} className="text-sm leading-relaxed text-blue-50">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-blue-100 text-sm italic">Presiona el botón para que la IA resuma los puntos clave de esta conversación.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Information & Actions Grid */}
            <div className="p-4 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-md transition-colors">
                    <h3 className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Información del Cliente</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">NOMBRE COMPLETO</label>
                            <input
                                type="text"
                                placeholder="Ej: Juan Pérez"
                                defaultValue={client?.name || ''}
                                onBlur={(e) => fetch(`/api/clients/${params.clientId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: e.target.value })
                                }).then(res => res.json()).then(data => {
                                    if (data.success) setClient(data.data);
                                })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                            WhatsApp: {client?.phoneNumber}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-md transition-colors">
                    <h3 className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Notas del Cliente</h3>
                    <textarea
                        placeholder="Añade detalles importantes..."
                        className="w-full text-base bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 p-3 text-gray-900 dark:text-white h-24 resize-none leading-relaxed transition-all"
                        defaultValue={client?.notes || ''}
                        onBlur={(e) => fetch(`/api/clients/${params.clientId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notes: e.target.value })
                        })}
                    />
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-md flex flex-col justify-between transition-colors">
                    <div>
                        <h3 className="text-xs font-black text-blue-800 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Gestión de Servicio</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">FECHA DE VENCIMIENTO</label>
                                <input
                                    type="date"
                                    defaultValue={client?.expirationDate ? new Date(client.expirationDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => fetch(`/api/clients/${params.clientId}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ expirationDate: e.target.value })
                                    })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reminders List Section */}
            <div className="max-w-5xl w-full mx-auto p-4 mb-20">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden transition-colors">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>📌</span> Recordatorios y Tareas
                        </h3>
                        <button
                            onClick={() => setShowReminderModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                        >
                            + Nuevo
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {reminders.length > 0 ? (
                            reminders.map((rem: IReminder) => (
                                <div key={rem._id.toString()} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={rem.completed}
                                            onChange={(e) => handleToggleReminder(rem._id.toString(), e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div>
                                            <p className={`text-sm font-bold ${rem.completed ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                {rem.description}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${rem.type === 'cobrar' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                                                    rem.type === 'renovar' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' :
                                                        'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                                    }`}>
                                                    {rem.type}
                                                </span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                                                    📅 {new Date(rem.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReminder(rem._id.toString())}
                                        className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <span className="text-xl">×</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                                <p className="italic">No hay recordatorios registrados para este cliente.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reminder Modal */}
            {showReminderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-slate-800 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Nuevo Recordatorio</h2>
                        <form onSubmit={handleAddReminder} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wider">TIPO DE TAREA</label>
                                <select
                                    value={newReminder.type}
                                    onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="cobrar">💵 COBRAR</option>
                                    <option value="renovar">🔄 RENOVAR</option>
                                    <option value="seguimiento">📞 SEGUIMIENTO</option>
                                    <option value="otro">📝 OTRO</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wider">FECHA LÍMITE</label>
                                <input
                                    type="date"
                                    required
                                    value={newReminder.dueDate}
                                    onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wider">DESCRIPCIÓN</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Enviar link de pago de Netflix..."
                                    value={newReminder.description}
                                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowReminderModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .pattern {
          background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
          background-repeat: repeat;
        }
      `}</style>
        </div>
    );
}

