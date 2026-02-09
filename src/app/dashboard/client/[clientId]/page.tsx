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
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
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
            const [clientRes, messagesRes] = await Promise.all([
                fetch(`/api/clients/${params.clientId}`),
                fetch(`/api/clients/${params.clientId}/messages`)
            ]);
            const clientData = await clientRes.json();
            const messagesData = await messagesRes.json();

            if (clientData.success) setClient(clientData.data);
            if (messagesData.success) setMessages(messagesData.data);
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
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-blue-600 text-2xl">←</button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">{client.name || client.phoneNumber}</h1>
                            <p className="text-xs text-gray-500">{client.phoneNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={client.status}
                            onChange={(e) => updateStatus(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Nuevo">Nuevo</option>
                            <option value="Interesado">Interesado</option>
                            <option value="Proximamente">Próximamente</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Main Content (ChatArea) */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto bg-white shadow-lg my-4 rounded-xl border border-gray-200">

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] pattern">
                    {messages.map((msg: any) => (
                        <div
                            key={msg._id}
                            className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] p-3 rounded-lg shadow-sm relative ${msg.direction === 'outgoing'
                                ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none'
                                : 'bg-white text-gray-800 rounded-tl-none'
                                }`}>
                                <p className="text-sm">{msg.body}</p>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">
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
                            placeholder="Escribe un mensaje..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm text-gray-900"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-shadow shadow-md disabled:bg-gray-400"
                        >
                            {sending ? '...' : '➤'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer Info Area */}
            <div className="p-4 max-w-5xl w-full mx-auto grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notas del Cliente</h3>
                    <textarea
                        placeholder="Escribe recordatorios o detalles aquí..."
                        className="w-full text-sm border-none focus:ring-0 p-0 text-gray-900 h-20 resize-none bg-transparent"
                        defaultValue={client.notes}
                        onBlur={(e) => fetch(`/api/clients/${params.clientId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notes: e.target.value })
                        })}
                    />
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Info del Servicio</h3>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Vencimiento: <span className="text-blue-600">{client.expirationDate ? new Date(client.expirationDate).toLocaleDateString() : 'No definido'}</span></p>
                        <p className="text-xs text-gray-500">Última interacción: {new Date(client.lastInteraction).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .pattern {
          background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
          background-repeat: repeat;
        }
      `}</style>
        </div>
    );
}
