

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Goal } from '../../types';
import { DotsVerticalIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '../icons/NavIcons';

interface GoalCardProps {
    goal: Goal;
    isSelected: boolean;
    onToggleSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const statusStyles = {
    Active: { dot: 'bg-blue-400', text: 'text-blue-400' },
    Paused: { dot: 'bg-yellow-400', text: 'text-yellow-400' },
    Completed: { dot: 'bg-green-400', text: 'text-green-400' },
};

const priorityStyles = {
    High: 'bg-red-500/20 text-red-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Low: 'bg-gray-500/20 text-gray-400',
};

const DeadlineChip: React.FC<{ deadline: string | null; status: Goal['status'] }> = ({ deadline, status }) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const isOverdue = deadlineDate < now && status !== 'Completed';

    const formattedDate = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const chipClass = isOverdue
        ? 'text-red-400 bg-red-500/10'
        : 'text-brand-text-secondary bg-brand-surface-2';

    return <span className={`text-xs font-semibold px-2 py-1 rounded-md ${chipClass}`}>{formattedDate}</span>;
};

const GoalCard: React.FC<GoalCardProps> = ({ goal, isSelected, onToggleSelect, onEdit, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { dot, text } = statusStyles[goal.status];

    return (
        <div className={`bg-brand-surface rounded-2xl p-5 flex flex-col h-full border transition-all duration-300 group ${isSelected ? 'border-brand-blue shadow-lg shadow-brand-blue/10' : 'border-brand-border hover:border-white/20'}`}>
            {/* Header with Checkbox and Menu */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="h-4 w-4 rounded bg-brand-surface-2 border-brand-border text-brand-blue focus:ring-brand-blue mt-1" />
                    <div>
                        <h3 className="font-bold text-brand-text-primary leading-tight truncate" title={goal.title}>{goal.title}</h3>
                        <p className="text-xs text-brand-text-secondary line-clamp-2">{goal.description}</p>
                    </div>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(p => !p)} className="p-1 text-brand-text-secondary hover:text-white">
                        <DotsVerticalIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-40 bg-brand-surface-2 border border-brand-border rounded-lg shadow-xl z-10 animate-fade-in-scale origin-top-right">
                            <button onClick={onEdit} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-border"> <PencilIcon className="w-4 h-4"/> Edit</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-brand-border">Duplicate</button>
                             <div className="my-1 h-px bg-brand-border"></div>
                            <button onClick={onDelete} className="w-full text-left px-3 py-2 text-sm text-red-400 flex items-center gap-2 hover:bg-brand-border"><TrashIcon className="w-4 h-4"/> Delete</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="my-2">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                        <span className={`text-xs font-semibold ${text}`}>{goal.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-text-primary">{goal.progress}%</span>
                </div>
                <div className="w-full bg-brand-surface-2 rounded-full h-2">
                    <div className="bg-brand-blue h-2 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
            </div>

            {/* Footer with Info */}
            <div className="mt-auto pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${priorityStyles[goal.priority]}`}>{goal.priority}</span>
                    <DeadlineChip deadline={goal.deadline} status={goal.status} />
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden">
                    {goal.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-brand-surface-2 px-2 py-0.5 rounded text-brand-text-secondary whitespace-nowrap">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GoalCard;