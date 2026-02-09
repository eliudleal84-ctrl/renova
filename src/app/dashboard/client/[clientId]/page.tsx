'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { use } from 'react';

export default function ClientDetailPage({ params: paramsPromise }: { params: Promise<{ clientId: string }> }) {
    const params = use(paramsPromise);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [reminders, setReminders] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [newReminder, setNewReminder] = useState({ type: 'seguimiento', dueDate: '', description: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-gray-500 mb-4">No se encontró el cliente o no tienes acceso.</p>
                <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-bold">Volver al Dashboard</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-blue-600 text-2xl">←</button>
                        <div>
                            <h1 className="text-lg font-bold text-blue-600">{client.name || client.phoneNumber} <span className="text-[10px] text-gray-300 font-normal">v1.2</span></h1>
                            <p className="text-xs text-gray-500">{client.phoneNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
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

            {/* Main Content (ChatArea) */}
            <div className="h-[600px] flex flex-col max-w-5xl w-full mx-auto bg-white shadow-lg my-4 rounded-xl border border-gray-200">

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] pattern">
                    {messages.map((msg: any) => (
                        <div
                            key={msg._id}
                            className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] p-3 rounded-lg shadow-sm relative ${msg.direction === 'outgoing'
                                ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none border-l-4 border-green-500'
                                : 'bg-white text-gray-900 rounded-tl-none border-l-4 border-blue-500'
                                }`}>
                                <p className="text-sm font-medium leading-relaxed">{msg.body}</p>
                                <p className="text-[10px] text-gray-500 mt-2 text-right font-bold">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje aquí..."
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none shadow-inner text-gray-900 font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="w-14 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:bg-gray-400"
                        >
                            {sending ? '...' : '➤'}
                        </button>
                    </form>
                </div>
            </div>

            {/* IA & Footer Grid */}
            <div className="p-4 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* IA Summary Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl border border-indigo-400 shadow-lg text-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100">Resumen Mágico IA</h3>
                        <button
                            onClick={handleGenerateSummary}
                            disabled={summarizing}
                            className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-50 transition-all disabled:opacity-50"
                        >
                            {summarizing ? 'PENSANDO...' : '✨ GENERAR'}
                        </button>
                    </div>
                    {aiSummary ? (
                        <div className="text-xs leading-relaxed space-y-2 overflow-y-auto max-h-40 pr-2 custom-scrollbar">
                            <div className="prose prose-invert prose-xs">
                                {aiSummary.split('\n').map((line, i) => (
                                    <p key={i} className="mb-1">{line}</p>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-center opacity-60">
                            <span className="text-3xl mb-2">🤖</span>
                            <p className="text-[10px] font-bold">Haz clic en Generar para que la IA analice el chat.</p>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                    <h3 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em] mb-4">Notas del Cliente</h3>
                    <textarea
                        placeholder="Añade detalles importantes, deudas o recordatorios..."
                        className="w-full text-base border-2 border-gray-100 rounded-lg focus:border-blue-200 focus:ring-0 p-3 text-gray-900 h-24 resize-none leading-relaxed"
                        defaultValue={client.notes}
                        onBlur={(e) => fetch(`/api/clients/${params.clientId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notes: e.target.value })
                        })}
                    />
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em] mb-4">Gestión de Servicio</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">FECHA DE VENCIMIENTO</label>
                                <input
                                    type="date"
                                    defaultValue={client.expirationDate ? new Date(client.expirationDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => fetch(`/api/clients/${params.clientId}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ expirationDate: e.target.value })
                                    })}
                                    className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg text-gray-900 font-bold focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4 font-medium italic">
                        Última interacción registrada: {new Date(client.lastInteraction).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Reminders Section */}
            <div className="p-4 max-w-5xl w-full mx-auto mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em]">Recordatorios del Cliente</h3>
                        <button
                            onClick={() => setShowReminderModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            + NUEVA TAREA
                        </button>
                    </div>

                    <div className="space-y-3">
                        {reminders.length > 0 ? (
                            reminders.map((rem: any) => (
                                <div
                                    key={rem._id}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${rem.completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-blue-50 hover:border-blue-200'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={rem.completed}
                                            onChange={(e) => handleToggleReminder(rem._id, e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div>
                                            <p className={`text-sm font-bold ${rem.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                {rem.description}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${rem.type === 'cobrar' ? 'bg-red-100 text-red-600' :
                                                    rem.type === 'renovar' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {rem.type}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold">
                                                    📅 {new Date(rem.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReminder(rem._id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <span className="text-xl">×</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="text-sm text-gray-400 font-medium italic">No hay tareas pendientes para este cliente.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reminder Modal */}
            {showReminderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-black text-gray-900 mb-6">Nuevo Recordatorio</h2>
                        <form onSubmit={handleAddReminder} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Tipo de Tarea</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cobrar', 'seguimiento', 'renovar'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setNewReminder({ ...newReminder, type: t })}
                                            className={`py-2 rounded-lg text-xs font-black uppercase border-2 transition-all ${newReminder.type === t
                                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                                : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Fecha Límite</label>
                                <input
                                    type="date"
                                    required
                                    value={newReminder.dueDate}
                                    onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-gray-900 font-bold focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Descripción</label>
                                <textarea
                                    required
                                    placeholder="Escribe qué necesitas hacer..."
                                    value={newReminder.description}
                                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg text-gray-900 font-medium focus:border-blue-500 outline-none h-24 resize-none"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReminderModal(false)}
                                    className="flex-1 px-6 py-3 rounded-lg text-sm font-black text-gray-400 hover:bg-gray-50 transition-colors"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    GUARDAR
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

