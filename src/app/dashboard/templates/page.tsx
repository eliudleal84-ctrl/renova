'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IWhatsAppTemplate } from '@/types';

export default function TemplatesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [templates, setTemplates] = useState<IWhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // New Template State
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        language: 'es',
        category: 'MARKETING',
        bodyText: '',
        variables: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        setDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') fetchTemplates();
    }, [status]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            if (data.success) setTemplates(data.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Process variables from comma-separated string
            const varsArray = newTemplate.variables.split(',').map(v => v.trim()).filter(v => v !== '');

            const payload = {
                name: newTemplate.name,
                language: newTemplate.language,
                category: newTemplate.category,
                components: [
                    {
                        type: 'BODY',
                        text: newTemplate.bodyText
                    }
                ],
                variables: varsArray,
                status: 'APPROVED' // We assume approved for now as this is a personal manager
            };

            const res = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setShowAddModal(false);
                setNewTemplate({ name: '', language: 'es', category: 'MARKETING', bodyText: '', variables: '' });
                fetchTemplates();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-blue-600 transition-colors">
                            ← Volver
                        </button>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">📋</span>
                            Gestión de Plantillas
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span>+</span> NUEVA PLANTILLA
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div key={template._id.toString()} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">
                                    {template.category}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">{template.language.toUpperCase()}</span>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                {template.name}
                            </h3>
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 mb-4">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium italic line-clamp-4 whitespace-pre-wrap leading-relaxed">
                                    {template.components.find(c => c.type === 'BODY')?.text}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {template.variables.map(v => (
                                    <span key={v} className="text-[9px] font-black px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-slate-700">
                                        {`{{${v}}}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
                                <span className="text-4xl opacity-40">📋</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tienes plantillas guardadas</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-6">
                                Registra aquí las plantillas que ya tienes aprobadas en Meta para poder enviarlas desde el chat de tus clientes.
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="text-blue-600 font-black text-sm hover:underline uppercase tracking-widest"
                            >
                                Crear mi primera plantilla
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Agregar Plantilla */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Nueva Plantilla Oficial</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>
                        <form onSubmit={handleCreateTemplate} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest">Nombre (Exacto de Meta)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="ej: recordatorio_pago"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest">Idioma (Código Meta)</label>
                                    <select
                                        value={newTemplate.language}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none mb-2"
                                    >
                                        <option value="es">Español (es)</option>
                                        <option value="es_MX">Español México (es_MX)</option>
                                        <option value="en">English (en)</option>
                                        <option value="en_US">English US (en_US)</option>
                                        <option value="pt_BR">Portugués (pt_BR)</option>
                                        <option value="other">Otro (Escribir abajo)</option>
                                    </select>
                                    {newTemplate.language === 'other' || !['es', 'es_MX', 'en', 'en_US', 'pt_BR'].includes(newTemplate.language) ? (
                                        <input
                                            type="text"
                                            placeholder="Ej: es_ES, fr_FR..."
                                            onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none"
                                        />
                                    ) : null}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest">Categoría</label>
                                    <select
                                        value={newTemplate.category}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none"
                                    >
                                        <option value="MARKETING">Marketing</option>
                                        <option value="UTILITY">Utilidad</option>
                                        <option value="AUTHENTICATION">Autenticación</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest">Contenido del Mensaje</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Hola {{1}}, tu servicio vence el {{2}}..."
                                    value={newTemplate.bodyText}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-widest">Variables (Ej: 1, 2, 3)</label>
                                <input
                                    type="text"
                                    placeholder="Separa con comas"
                                    value={newTemplate.variables}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Plantilla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
