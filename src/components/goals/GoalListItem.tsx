
import React from 'react';
import type { Goal } from '../../types';
import { PencilIcon, TrashIcon } from '../icons/NavIcons';

const statusStyles = {
    Active: { dot: 'bg-blue-400' },
    Paused: { dot: 'bg-yellow-400' },
    Completed: { dot: 'bg-green-400' },
};

const priorityStyles = {
    High: 'bg-red-500/20 text-red-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Low: 'bg-gray-500/20 text-gray-400',
};

const DeadlineChip: React.FC<{ deadline: string | null; status: Goal['status'] }> = ({ deadline, status }) => {
    if (!deadline) return <span className="text-xs text-brand-text-secondary/50">No Deadline</span>;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const isOverdue = deadlineDate < now && status !== 'Completed';
    const formattedDate = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const chipClass = isOverdue ? 'text-red-400' : 'text-brand-text-secondary';
    return <span className={`text-xs font-semibold ${chipClass}`}>{formattedDate}</span>;
};


const GoalListItem: React.FC<{
    goal: Goal;
    isSelected: boolean;
    onToggleSelect: () => void;
    onEdit: (goal: Goal) => void;
    onDelete: (goal: Goal) => void;
}> = ({ goal, isSelected, onToggleSelect, onEdit, onDelete }) => {
    const { dot } = statusStyles[goal.status];

    return (
        <div className={`group relative px-4 py-3 bg-brand-surface rounded-lg border flex items-center gap-4 transition-all duration-300 ${isSelected ? 'border-brand-blue bg-brand-surface-2/50' : 'border-brand-border hover:border-brand-blue hover:bg-brand-surface-2/50'}`}>
            <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="h-4 w-4 rounded bg-brand-surface-2 border-brand-border text-brand-blue focus:ring-brand-blue focus:ring-offset-brand-surface shrink-0" />
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`}></span>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-brand-text-primary truncate" title={goal.title}>{goal.title}</p>
                </div>
            </div>
            
            <div className="hidden lg:flex w-48 shrink-0 items-center">
                 <div className="w-full bg-brand-surface-2 rounded-full h-1.5">
                    <div className="bg-brand-blue h-1.5 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                 </div>
                 <span className="text-xs font-semibold text-brand-text-primary w-12 text-right">{goal.progress}%</span>
            </div>

            <div className="hidden md:block w-24 text-center shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${priorityStyles[goal.priority]}`}>{goal.priority}</span>
            </div>

            <div className="hidden sm:block w-24 text-right shrink-0">
                <DeadlineChip deadline={goal.deadline} status={goal.status} />
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button onClick={() => onEdit(goal)} className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors" title={`Edit ${goal.title}`}><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(goal)} className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border transition-colors border-l border-brand-border" title={`Delete ${goal.title}`}><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};
export default GoalListItem;
