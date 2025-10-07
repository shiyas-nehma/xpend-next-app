
'use client';

import React, { useState, useEffect } from 'react';
// Removed direct GoogleGenerativeAI import; using server AI route.
import type { Goal } from '@/types';
import { XIcon, SparklesIcon } from '@/components/icons/NavIcons';

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, 'id'> & { id?: number }) => void;
    goalToEdit: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, goalToEdit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [progress, setProgress] = useState(0);
    const [priority, setPriority] = useState<Goal['priority']>('Medium');
    const [status, setStatus] = useState<Goal['status']>('Active');
    const [deadline, setDeadline] = useState<string>('');
    const [tags, setTags] = useState('');

    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    useEffect(() => {
        if (goalToEdit) {
            setTitle(goalToEdit.title || '');
            setDescription(goalToEdit.description);
            setProgress(goalToEdit.progress);
            setPriority(goalToEdit.priority);
            setStatus(goalToEdit.status);
            setDeadline(goalToEdit.deadline ? new Date(goalToEdit.deadline).toISOString().split('T')[0] : '');
            setTags((goalToEdit.tags || []).join(', '));
        } else {
            setTitle('');
            setDescription('');
            setProgress(0);
            setPriority('Medium');
            setStatus('Active');
            setDeadline('');
            setTags('');
            setAiPrompt('');
        }
        setGenerationError(null);
        setIsGenerating(false);
    }, [goalToEdit, isOpen]);

        const handleAIGenerate = async () => {
            if (!aiPrompt) return;
            setIsGenerating(true);
            setGenerationError(null);
            try {
                const prompt = `You are an assistant that structures user financial goals. Return ONLY raw JSON with no markdown fences. Schema: {"title": string, "description": string, "priority": "High"|"Medium"|"Low", "tags": string} where tags is a comma separated list of 2-3 short tags. User goal: ${aiPrompt}`;
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: prompt, history: [] })
                });
                if (!res.ok) throw new Error('AI request failed');
                const data = await res.json();
                const text: string = data.text || '';
                const cleaned = text.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
                const result = JSON.parse(cleaned);
                setTitle(result.title || '');
                setDescription(result.description || '');
                setPriority(result.priority || 'Medium');
                setTags(result.tags || '');
            } catch (error) {
                console.error('AI Goal Generation failed:', error);
                setGenerationError("Sorry, I couldn't generate suggestions. Please try again.");
            } finally {
                setIsGenerating(false);
            }
        };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: goalToEdit?.id,
            title,
            description,
            progress,
            priority,
            status,
            deadline: deadline || null,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in-scale">
            <div className="w-full max-w-lg bg-brand-surface rounded-2xl shadow-2xl p-8 z-10 border border-transparent [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(93,120,255,0.5))_border-box] relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">{goalToEdit ? 'Edit Goal' : 'New Goal'}</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white"><XIcon /></button>
                </div>

                {!goalToEdit && (
                    <>
                        <div className="mb-6 p-4 bg-brand-surface-2 rounded-lg border border-brand-border">
                            <label htmlFor="ai-prompt" className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary mb-2">
                                <SparklesIcon className="w-5 h-5 text-brand-yellow" />
                                Describe your goal and let AI fill the form
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="ai-prompt"
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    placeholder="e.g., Save $5,000 for a trip to Japan by next year"
                                    className="flex-grow bg-brand-surface border border-brand-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                    disabled={isGenerating}
                                />
                                <button
                                    type="button"
                                    onClick={handleAIGenerate}
                                    disabled={!aiPrompt || isGenerating}
                                    className="bg-brand-blue text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center w-28"
                                >
                                    {isGenerating ? (
                                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Generate'
                                    )}
                                </button>
                            </div>
                            {generationError && <p className="text-red-400 text-xs mt-2">{generationError}</p>}
                        </div>
                        <div className="h-px bg-brand-border mb-6"></div>
                    </>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-brand-text-secondary mb-1">Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-brand-text-secondary mb-1">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-brand-text-secondary mb-1">Priority</label>
                            <select id="priority" value={priority} onChange={e => setPriority(e.target.value as Goal['priority'])} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
                            <select id="status" value={status} onChange={e => setStatus(e.target.value as Goal['status'])} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option>Active</option>
                                <option>Paused</option>
                                <option>Completed</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="progress" className="block text-sm font-medium text-brand-text-secondary mb-1">Progress ({progress}%)</label>
                        <input type="range" id="progress" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full h-2 bg-brand-surface-2 rounded-lg appearance-none cursor-pointer" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-brand-text-secondary mb-1">Deadline</label>
                            <input type="date" id="deadline" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                        </div>
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-brand-text-secondary mb-1">Tags</label>
                            <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="Marketing, Q3, Web" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border">Cancel</button>
                        <button type="submit" className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">Save Goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalModal;
