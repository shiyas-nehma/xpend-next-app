

import React, { useState, useMemo } from 'react';
import type { Goal } from '../types';
import { mockGoals } from '../../data/mockData';
import { useToast } from '../../hooks/useToast';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, CheckCircleIcon, GridIcon, ListIcon } from '../../components/icons/NavIcons';
import EmptyState from '../../components/common/EmptyState';
import EmptyStateIcon from '../../components/icons/EmptyStateIcon';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import GoalCard from '../../components/goals/GoalCard';
import GoalModal from '../../components/goals/GoalModal';
import GoalListItem from '../../components/goals/GoalListItem';

const FilterSelect: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; }> = ({ value, onChange, children }) => (
    <select value={value} onChange={onChange} className="bg-brand-surface border border-brand-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-text-primary">
        {children}
    </select>
);

const GoalsPage: React.FC = () => {
    const [goals, setGoals] = useState<Goal[]>(mockGoals);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const [filters, setFilters] = useState({
        status: 'All',
        priority: 'All',
        deadline: 'All',
    });
    const [sort, setSort] = useState('Recently Updated');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const { addToast } = useToast();

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({ status: 'All', priority: 'All', deadline: 'All' });
        setSort('Recently Updated');
    };

    const filteredAndSortedGoals = useMemo(() => {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        let filtered = goals.filter(goal => {
            const searchMatch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) || goal.description.toLowerCase().includes(searchQuery.toLowerCase());
            const statusMatch = filters.status === 'All' || goal.status === filters.status;
            const priorityMatch = filters.priority === 'All' || goal.priority === filters.priority;

            let deadlineMatch = true;
            if (filters.deadline !== 'All') {
                if (filters.deadline === 'No Deadline') {
                    deadlineMatch = goal.deadline === null;
                } else if (goal.deadline) {
                    const deadlineDate = new Date(goal.deadline);
                    if (filters.deadline === 'Overdue') {
                        deadlineMatch = deadlineDate < now && goal.status !== 'Completed';
                    } else if (filters.deadline === 'Due Soon') {
                        deadlineMatch = deadlineDate >= now && deadlineDate <= sevenDaysFromNow;
                    }
                } else {
                    deadlineMatch = false;
                }
            }

            return searchMatch && statusMatch && priorityMatch && deadlineMatch && !goal.archived;
        });

        return filtered.sort((a, b) => {
            switch (sort) {
                case 'Deadline':
                    if (a.deadline === null) return 1;
                    if (b.deadline === null) return -1;
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                case 'Priority':
                    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'Progress':
                    return b.progress - a.progress;
                case 'Recently Updated':
                default:
                    return b.id - a.id;
            }
        });
    }, [goals, searchQuery, filters, sort]);

    const handleToggleSelection = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredAndSortedGoals.map(g => g.id));
        } else {
            setSelectedIds([]);
        }
    };
    
    const isAllSelected = selectedIds.length > 0 && selectedIds.length === filteredAndSortedGoals.length;

    const handleOpenModal = (goal: Goal | null) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingGoal(null);
        setIsModalOpen(false);
    };

    const handleSaveGoal = (goalData: Omit<Goal, 'id'> & { id?: number }) => {
        if (goalData.id) {
            setGoals(goals.map(g => g.id === goalData.id ? { ...g, ...goalData } as Goal : g));
            addToast('Goal updated successfully!', 'success');
        } else {
            const newGoal: Goal = { ...goalData, id: Date.now(), archived: false, tags: goalData.tags || [] };
            setGoals(prev => [newGoal, ...prev]);
            addToast('New goal created!', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (goal: Goal) => setDeletingGoal(goal);
    
    const handleConfirmDelete = () => {
        if (deletingGoal) {
            setGoals(goals.filter(g => g.id !== deletingGoal.id));
            addToast('Goal deleted.', 'info');
            setDeletingGoal(null);
        }
    };

    const handleBulkMarkComplete = () => {
        setGoals(prevGoals =>
            prevGoals.map(goal =>
                selectedIds.includes(goal.id)
                    ? { ...goal, progress: 100, status: 'Completed' }
                    : goal
            )
        );
        addToast(`${selectedIds.length} ${selectedIds.length > 1 ? 'goals have' : 'goal has'} been marked as complete.`, 'success');
        setSelectedIds([]);
    };

    const handleBulkDeleteRequest = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const handleConfirmBulkDelete = () => {
        setGoals(prevGoals => prevGoals.filter(goal => !selectedIds.includes(goal.id)));
        addToast(`${selectedIds.length} ${selectedIds.length > 1 ? 'goals' : 'goal'} deleted.`, 'info');
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
    };

    return (
        <>
            <div className="p-8 flex flex-col h-full">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text-primary">Goals</h1>
                    </div>
                    <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                        <PlusIcon className="w-5 h-5" />
                        <span>New Goal</span>
                    </button>
                </div>

                 {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search goals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-brand-surface border border-brand-border rounded-lg py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            />
                        </div>
                        <FilterSelect value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                            <option value="Completed">Completed</option>
                        </FilterSelect>
                        <FilterSelect value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
                             <option value="All">All Priorities</option>
                             <option value="High">High</option>
                             <option value="Medium">Medium</option>
                             <option value="Low">Low</option>
                        </FilterSelect>
                        <FilterSelect value={filters.deadline} onChange={e => setFilters(f => ({ ...f, deadline: e.target.value }))}>
                            <option value="All">All Deadlines</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Due Soon">Due Soon</option>
                            <option value="No Deadline">No Deadline</option>
                        </FilterSelect>
                        <FilterSelect value={sort} onChange={e => setSort(e.target.value)}>
                            <option>Recently Updated</option>
                            <option>Deadline</option>
                            <option>Priority</option>
                            <option>Progress</option>
                        </FilterSelect>
                         <button onClick={clearFilters} className="text-sm text-brand-text-secondary hover:text-white">Clear</button>
                    </div>
                     <div className="flex items-center space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                        <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-brand-surface-2 text-white' : 'text-brand-text-secondary hover:text-white'}`} title="Grid View" aria-pressed={view === 'grid'}>
                            <GridIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-brand-surface-2 text-white' : 'text-brand-text-secondary hover:text-white'}`} title="List View" aria-pressed={view === 'list'}>
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>


                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="mb-4 p-3 bg-brand-surface-2 rounded-lg border border-brand-blue/50 flex items-center justify-between animate-fade-in-scale">
                         <div className="flex items-center gap-4">
                            <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded bg-brand-surface-2 border-brand-border text-brand-blue focus:ring-brand-blue" />
                            <span className="text-sm font-semibold">{selectedIds.length} selected</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={handleBulkMarkComplete} className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-md hover:bg-brand-border"><CheckCircleIcon className="w-4 h-4 text-green-400" /> Mark Complete</button>
                            <button onClick={handleBulkDeleteRequest} className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-md hover:bg-brand-border hover:text-red-400"><TrashIcon className="w-4 h-4" /> Delete</button>
                         </div>
                    </div>
                )}
                
                {/* Content */}
                <div className="flex-grow">
                    {goals.length === 0 ? (
                        <EmptyState icon={<EmptyStateIcon />} title="No goals yet" message="Create your first goal to start tracking your progress." primaryAction={<button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition">Create First Goal</button>} />
                    ) : filteredAndSortedGoals.length === 0 ? (
                        <EmptyState icon={<EmptyStateIcon />} title="No goals found" message="Try adjusting your filters or search query." primaryAction={<button onClick={clearFilters} className="bg-brand-surface-2 border border-brand-border font-bold py-2 px-4 rounded-lg hover:bg-brand-border">Clear Filters</button>} />
                    ) : (
                        view === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredAndSortedGoals.map(goal => (
                                    <GoalCard key={goal.id} goal={goal} isSelected={selectedIds.includes(goal.id)} onToggleSelect={() => handleToggleSelection(goal.id)} onEdit={() => handleOpenModal(goal)} onDelete={() => handleDelete(goal)} />
                                ))}
                            </div>
                        ) : (
                             <div className="space-y-3">
                                {filteredAndSortedGoals.map(goal => (
                                    <GoalListItem key={goal.id} goal={goal} isSelected={selectedIds.includes(goal.id)} onToggleSelect={() => handleToggleSelection(goal.id)} onEdit={() => handleOpenModal(goal)} onDelete={() => handleDelete(goal)} />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
            
            <GoalModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveGoal} goalToEdit={editingGoal} />
            <ConfirmationModal isOpen={!!deletingGoal} onClose={() => setDeletingGoal(null)} onConfirm={handleConfirmDelete} title="Delete Goal" message={`Are you sure you want to permanently delete the goal "${deletingGoal?.title}"? This action cannot be undone.`} confirmText="DELETE" />
            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title={`Delete ${selectedIds.length} Goal${selectedIds.length > 1 ? 's' : ''}`}
                message={`Are you sure you want to permanently delete these ${selectedIds.length} ${selectedIds.length > 1 ? 'goals' : 'goal'}? This action cannot be undone.`}
                confirmText="DELETE"
            />
        </>
    );
};

export default GoalsPage;
