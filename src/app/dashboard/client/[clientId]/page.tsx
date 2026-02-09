'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { use } from 'react';
import { IClient, IMessage, IReminder, IPayment, IWhatsAppTemplate } from '@/types';

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

    // Estados para Pagos
    const [payments, setPayments] = useState<IPayment[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [newPayment, setNewPayment] = useState({ amount: '', service: '', durationMonths: '1', notes: '', paymentDate: new Date().toISOString().split('T')[0] });
    const [registeringPayment, setRegisteringPayment] = useState(false);

    // Estados para Sugerencias de IA
    const [suggestingResponse, setSuggestingResponse] = useState(false);
    const [showAiMenu, setShowAiMenu] = useState(false);

    // Estados para Plantillas
    const [templates, setTemplates] = useState<IWhatsAppTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<IWhatsAppTemplate | null>(null);
    const [templateVariables, setTemplateVariables] = useState<{ [key: string]: string }>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
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

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior
            });
        }
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
        if (messages.length > 0) {
            if (isFirstLoad.current) {
                scrollToBottom('auto');
                isFirstLoad.current = false;
            } else {
                scrollToBottom('smooth');
            }
        }
    }, [messages]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientRes, messagesRes, remindersRes, paymentsRes, templatesRes] = await Promise.all([
                fetch(`/api/clients/${params.clientId}`),
                fetch(`/api/clients/${params.clientId}/messages`),
                fetch(`/api/clients/${params.clientId}/reminders`),
                fetch(`/api/clients/${params.clientId}/payments`),
                fetch('/api/templates')
            ]);
            const clientData = await clientRes.json();
            const messagesData = await messagesRes.json();
            const remindersData = await remindersRes.json();
            const paymentsData = await paymentsRes.json();
            const templatesData = await templatesRes.json();

            if (clientData.success) setClient(clientData.data);
            if (messagesData.success) setMessages(messagesData.data);
            if (remindersData.success) setReminders(remindersData.data);
            if (paymentsData.success) setPayments(paymentsData.data);
            if (templatesData.success) setTemplates(templatesData.data);
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

    const fetchPayments = async () => {
        try {
            const res = await fetch(`/api/clients/${params.clientId}/payments`);
            const data = await res.json();
            if (data.success) setPayments(data.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const handleRegisterPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisteringPayment(true);
        try {
            const res = await fetch(`/api/clients/${params.clientId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPayment)
            });
            const data = await res.json();
            if (data.success) {
                setShowPaymentModal(false);
                setNewPayment({ amount: '', service: '', durationMonths: '1', notes: '', paymentDate: new Date().toISOString().split('T')[0] });
                // Recargar datos para ver el nuevo vencimiento y estado
                fetchData();
            } else {
                alert('Error al registrar pago: ' + data.error);
            }
        } catch (error) {
            console.error('Error registering payment:', error);
        } finally {
            setRegisteringPayment(false);
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

    const handleSuggestResponse = async (tone: string) => {
        setSuggestingResponse(true);
        setShowAiMenu(false);
        try {
            const res = await fetch(`/api/clients/${params.clientId}/suggest-response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tone })
            });
            const data = await res.json();
            if (data.success) {
                setNewMessage(data.data);
            } else {
                alert('Error IA: ' + data.error);
            }
        } catch (error) {
            console.error('Error suggesting response:', error);
        } finally {
            setSuggestingResponse(false);
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
            <div className="h-[500px] flex flex-col max-w-5xl w-full mx-auto bg-white dark:bg-slate-900 shadow-lg my-4 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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

                {/* AI Suggestion Buttons */}
                <div className="px-4 py-2 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800/10 flex items-center justify-between">
                    <div className="flex gap-2">
                        {suggestingResponse ? (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                IA PENSANDO RESPUESTA...
                            </span>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowAiMenu(!showAiMenu)}
                                    className="text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    ✨ SUGERIR RESPUESTA IA
                                </button>

                                {showAiMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-900/20">
                                            <p className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider">¿En qué tono?</p>
                                        </div>
                                        <div className="p-1">
                                            {[
                                                { id: 'amable', label: '😊 Amable (Recomendado)', color: 'hover:bg-green-50 dark:hover:bg-green-900/20' },
                                                { id: 'directo', label: '💼 Directo / Profesional', color: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                                                { id: 'urgencia', label: '⏰ Urgencia (Cerca de vencer)', color: 'hover:bg-orange-50 dark:hover:bg-orange-900/20' },
                                                { id: 'promocion', label: '🚀 Promoción / Persuasivo', color: 'hover:bg-purple-50 dark:hover:bg-purple-900/20' }
                                            ].map(tone => (
                                                <button
                                                    key={tone.id}
                                                    onClick={() => handleSuggestResponse(tone.id)}
                                                    className={`w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl transition-colors ${tone.color}`}
                                                >
                                                    {tone.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowTemplateModal(true)}
                            className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm transition-all active:scale-95 animate-pulse"
                        >
                            📋 PLANTILLAS OFICIALES
                        </button>
                    </div>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje o usa la IA para sugerir uno..."
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
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>💰</span> Registrar Pago / Renovación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial History Section */}
            <div className="max-w-5xl w-full mx-auto p-4 mb-8">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden transition-colors">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>💸</span> Historial de Pagos
                        </h3>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {payments.length} TRANSACCIONES
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800/30 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Fecha Pago</th>
                                    <th className="px-6 py-4">Servicio / Plan</th>
                                    <th className="px-6 py-4">Duración</th>
                                    <th className="px-6 py-4">Monto</th>
                                    <th className="px-6 py-4">Nuevo Vencimiento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {payments.length > 0 ? (
                                    payments.map((p) => (
                                        <tr key={p._id.toString()} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                                {new Date(p.paymentDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{p.service}</div>
                                                {p.notes && <div className="text-[10px] text-gray-400 dark:text-gray-500 italic mt-0.5">{p.notes}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded text-[10px] font-black uppercase">
                                                    {p.durationMonths} {p.durationMonths === 1 ? 'MES' : 'MESES'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                ${p.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                {new Date(p.newExpirationDate).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-600 text-sm italic">
                                            No hay registros de pagos previos para este cliente.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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

            {/* Modal: Registrar Pago */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 overflow-hidden relative transition-colors">
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 text-xl">💵</span>
                            Registrar Pago
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Completa los datos para actualizar el vencimiento del cliente.</p>

                        <form onSubmit={handleRegisterPayment} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Monto ($)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={newPayment.amount}
                                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-black text-lg focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Meses</label>
                                    <select
                                        value={newPayment.durationMonths}
                                        onChange={(e) => setNewPayment({ ...newPayment, durationMonths: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:ring-emerald-500 outline-none transition-all"
                                    >
                                        <option value="1">1 Mes</option>
                                        <option value="3">3 Meses</option>
                                        <option value="6">6 Meses</option>
                                        <option value="12">12 Meses (Año)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Servicio / Plan</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Plan Platinum, Cuenta Netflix..."
                                    value={newPayment.service}
                                    onChange={(e) => setNewPayment({ ...newPayment, service: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Fecha de Pago</label>
                                <input
                                    type="date"
                                    required
                                    value={newPayment.paymentDate}
                                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Notas (Opcional)</label>
                                <textarea
                                    placeholder="Detalles del pago..."
                                    value={newPayment.notes}
                                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:border-emerald-500 outline-none transition-all resize-none h-20"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-6 py-4 rounded-xl text-xs font-black text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    disabled={registeringPayment}
                                    className="flex-[2] px-6 py-4 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {registeringPayment ? 'Guardando...' : 'Confirmar Pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Seleccionar Plantilla */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 text-xl">📋</span>
                                    Plantillas de WhatsApp
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Selecciona una plantilla oficial para enviar.</p>
                            </div>
                            <button onClick={() => { setShowTemplateModal(false); setSelectedTemplate(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>

                        {!selectedTemplate ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                {templates.map(t => (
                                    <button
                                        key={t._id.toString()}
                                        onClick={() => {
                                            setSelectedTemplate(t);
                                            const vars: { [key: string]: string } = {};
                                            t.variables.forEach(v => vars[v] = '');
                                            setTemplateVariables(vars);
                                        }}
                                        className="text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                                {t.category}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">{t.language.toUpperCase()}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{t.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                                            {t.components.find(c => c.type === 'BODY')?.text}
                                        </p>
                                    </button>
                                ))}
                                {templates.length === 0 && (
                                    <div className="col-span-2 py-12 text-center">
                                        <p className="text-gray-400 italic">No hay plantillas registradas. Agrega algunas en la configuración.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                                    <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Vista Previa</h4>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm max-w-sm">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                            {selectedTemplate.components.find(c => c.type === 'BODY')?.text?.replace(/\{\{(\d+)\}\}/g, (_, num) => templateVariables[num] || `{{${num}}}`)}
                                        </p>
                                    </div>
                                </div>

                                {selectedTemplate.variables.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Variables Dinámicas</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedTemplate.variables.map(v => (
                                                <div key={v}>
                                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase">Dato {v}</label>
                                                    <input
                                                        type="text"
                                                        value={templateVariables[v] || ''}
                                                        onChange={(e) => setTemplateVariables({ ...templateVariables, [v]: e.target.value })}
                                                        placeholder={`Valor para {{${v}}}`}
                                                        className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-2 mt-auto">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTemplate(null)}
                                        className="flex-1 px-6 py-3 rounded-xl text-xs font-black text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setSending(true);
                                            try {
                                                const components = [{
                                                    type: 'body',
                                                    parameters: selectedTemplate.variables.map(v => ({
                                                        type: 'text',
                                                        text: templateVariables[v] || ''
                                                    }))
                                                }];

                                                const res = await fetch(`/api/clients/${params.clientId}/messages`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        templateName: selectedTemplate.name,
                                                        templateLanguage: selectedTemplate.language,
                                                        templateComponents: components
                                                    })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setShowTemplateModal(false);
                                                    setSelectedTemplate(null);
                                                    fetchMessages();
                                                } else {
                                                    alert('Error: ' + data.error);
                                                }
                                            } catch (error) {
                                                console.error(error);
                                            } finally {
                                                setSending(false);
                                            }
                                        }}
                                        disabled={sending}
                                        className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                    >
                                        {sending ? 'Enviando...' : 'Enviar Plantilla'}
                                    </button>
                                </div>
                            </div>
                        )}
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
