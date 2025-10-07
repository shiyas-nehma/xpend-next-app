

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, CreditCardIcon, CashIcon, BankIcon, ChevronDownIcon, MagnifyingGlassIcon, GridIcon, ListIcon, RefreshIcon } from '@/components/icons/NavIcons';
import type { Income, Category, Recurrence } from '@/types';
import CategoryModal from '@/components/category/CategoryModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import EmptyState from '@/components/common/EmptyState';
import EmptyStateIcon from '@/components/icons/EmptyStateIcon';
import { useToast } from '@/hooks/useToast';
import { useData } from '@/hooks/useData';
import { AnimatePresence, motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30
    }
  }
};

const paymentMethodIcons: Record<Income['paymentMethod'], React.ReactNode> = {
  Card: <CreditCardIcon className="w-4 h-4" />,
  Cash: <CashIcon className="w-4 h-4" />,
  Bank: <BankIcon className="w-4 h-4" />,
};

const getRelativeDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + tzOffset);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    localDate.setHours(0, 0, 0, 0);

    if (localDate.getTime() === today.getTime()) {
        return 'Today';
    }
    if (localDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }

    return new Date(date.getTime() + tzOffset).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const IncomeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (income: Omit<Income, 'id'> & { id?: number }) => void;
    incomeToEdit: Income | null;
}> = ({ isOpen, onClose, onSave, incomeToEdit }) => {
    const isEditing = !!incomeToEdit;
    const { categories, addCategory } = useData();
    const [amount, setAmount] = useState<string>('0.00');
    const [description, setDescription] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<Income['paymentMethod']>('Bank');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    
    // Recurrence state
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<Recurrence['frequency']>('Monthly');
    const [endType, setEndType] = useState<Recurrence['end']['type']>('Never');
    const [occurrences, setOccurrences] = useState<string>('12');
    const [endDate, setEndDate] = useState('');

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    useEffect(() => {
        if (incomeToEdit) {
            setAmount(incomeToEdit.amount.toFixed(2));
            setDescription(incomeToEdit.description);
            setPaymentMethod(incomeToEdit.paymentMethod);
            setDate(new Date(incomeToEdit.date).toISOString().split('T')[0]);
            setSelectedCategory(incomeToEdit.category);
            // Set recurrence state from incomeToEdit
            if (incomeToEdit.recurrence) {
                setIsRecurring(true);
                setFrequency(incomeToEdit.recurrence.frequency);
                setEndType(incomeToEdit.recurrence.end.type);
                if (incomeToEdit.recurrence.end.type === 'After' && typeof incomeToEdit.recurrence.end.value === 'number') {
                    setOccurrences(String(incomeToEdit.recurrence.end.value));
                }
                if (incomeToEdit.recurrence.end.type === 'OnDate' && typeof incomeToEdit.recurrence.end.value === 'string') {
                    setEndDate(incomeToEdit.recurrence.end.value);
                }
            } else {
                setIsRecurring(false);
            }
        } else {
            // Reset all state for new income
            setAmount('0.00');
            setDescription('');
            setPaymentMethod('Bank');
            setDate(new Date().toISOString().split('T')[0]);
            setSelectedCategory(null);
            setIsRecurring(false);
            setFrequency('Monthly');
            setEndType('Never');
            setOccurrences('12');
            setEndDate('');
        }
    }, [incomeToEdit, isOpen]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value === '') {
            setAmount('0.00');
            return;
        }
        const numValue = parseInt(value, 10);
        const formattedValue = (numValue / 100).toFixed(2);
        setAmount(formattedValue);
    };

    const handleSaveCategory = async (categoryData: Omit<Category, 'id' | 'transactions' | 'amount'> & { id?: number }) => {
        // Build temporary category for add, but rely on addCategory return value to get docId mapping
        const tempCategory: Category = {
            transactions: 0,
            amount: 0,
            ...categoryData,
            id: Date.now(),
        };
        try {
            const created = await addCategory(tempCategory);
            // Use the returned category (includes Firestore docId & mapped id)
            if (created) {
                setSelectedCategory(created);
            } else {
                setSelectedCategory(tempCategory); // fallback
            }
        } catch (e) {
            // addCategory already toasts error
        } finally {
            setIsCategoryModalOpen(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (numericAmount > 0 && description && selectedCategory) {
            let recurrence: Recurrence | undefined = undefined;
            if (isRecurring) {
                recurrence = {
                    frequency,
                    end: {
                        type: endType,
                        value: endType === 'After' ? parseInt(occurrences, 10) : (endType === 'OnDate' ? endDate : undefined),
                    },
                };
            }
            onSave({
                id: incomeToEdit?.id,
                amount: numericAmount,
                description,
                paymentMethod,
                date,
                category: selectedCategory,
                recurrence,
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in-scale">
                <div className="w-full max-w-2xl bg-brand-surface rounded-2xl shadow-2xl p-8 z-10 
                           border border-transparent 
                           [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(93,120,255,0.5))_border-box]
                           relative max-h-[90vh] flex flex-col">
                    
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)] -z-10"></div>
                    
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-brand-text-primary">{isEditing ? 'Edit Income' : 'Add New Income'}</h2>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                        
                        <div className="flex-shrink-0">
                            <div className="text-center pt-2 pb-6 border-b border-brand-border">
                                <label className="text-sm font-medium text-brand-text-secondary" htmlFor="incomeAmount">Amount</label>
                                <div className="relative mt-1 flex justify-center items-center">
                                    <span className="text-4xl font-medium text-brand-text-secondary mr-1">$</span>
                                    <input
                                        id="incomeAmount"
                                        type="text"
                                        value={amount === '0.00' ? '' : amount}
                                        onChange={handleAmountChange}
                                        placeholder="0.00"
                                        className="text-7xl font-bold text-blue-400 outline-none bg-transparent border-none focus:ring-0 text-center w-full p-0"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="py-6 space-y-4 px-2">
                                <div>
                                    <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="description">From</label>
                                    <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Monthly Salary" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="date">Date</label>
                                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                    </div>
                                    <div>
                                        <label className="block text-brand-text-secondary text-sm font-medium mb-1">Recurring</label>
                                        <div className="flex items-center h-full">
                                             <button
                                                type="button"
                                                onClick={() => setIsRecurring(!isRecurring)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-brand-surface
                                                            ${isRecurring ? 'bg-brand-blue' : 'bg-brand-surface-2'}`}
                                                role="switch"
                                                aria-checked={isRecurring}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                              ${isRecurring ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {isRecurring && (
                                     <div className="bg-brand-surface-2/50 border border-brand-border p-4 rounded-lg space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="frequency">Frequency</label>
                                                <select id="frequency" value={frequency} onChange={e => setFrequency(e.target.value as Recurrence['frequency'])} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                                    <option>Daily</option>
                                                    <option>Weekly</option>
                                                    <option>Monthly</option>
                                                    <option>Yearly</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-brand-text-secondary text-sm font-medium mb-1">Ends</label>
                                                <div className="flex space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border w-full">
                                                    {(['Never', 'After', 'OnDate'] as const).map(type => (
                                                        <button key={type} type="button" onClick={() => setEndType(type)} className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${endType === type ? 'bg-brand-surface-2 text-white shadow-sm' : 'text-brand-text-secondary hover:bg-brand-surface-2/50'}`}>
                                                            {type === 'OnDate' ? 'On Date' : type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {endType === 'After' && (
                                             <div className="relative">
                                                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="occurrences">After</label>
                                                <input id="occurrences" type="number" value={occurrences} onChange={e => setOccurrences(e.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg pl-3 pr-24 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                                <span className="absolute right-3 top-1/2 -translate-y-0.5 text-sm text-brand-text-secondary">occurrences</span>
                                             </div>
                                        )}
                                        {endType === 'OnDate' && (
                                            <div>
                                                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="endDate">End Date</label>
                                                <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                            </div>
                                        )}
                                     </div>
                                )}
                                <div className="mt-4">
                                    <label className="block text-brand-text-secondary text-sm font-medium mb-1">Received Via</label>
                                    <div className="flex space-x-2">
                                        {(['Card', 'Cash', 'Bank'] as const).map(method => (
                                            <button type="button" key={method} onClick={() => setPaymentMethod(method)} className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm rounded-lg border transition-colors ${paymentMethod === method ? 'bg-brand-surface-2 border-brand-blue text-brand-text-primary' : 'bg-brand-surface-2/50 border-brand-border text-brand-text-secondary hover:border-white/30 hover:text-brand-text-primary'}`}>
                                                {paymentMethodIcons[method]}
                                                <span>{method}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-grow flex flex-col min-h-0 pt-6 border-t border-brand-border">
                            <label className="block text-brand-text-secondary text-sm font-medium mb-3 flex-shrink-0">Category</label>
                            <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
                                    {categories.filter(c => c.type === 'Income').map(cat => (
                                        <button type="button" key={cat.id} onClick={() => setSelectedCategory(cat)} 
                                            className={`flex flex-col items-center justify-center text-center p-2 rounded-lg transition-all h-24 border-2
                                                        ${selectedCategory?.id === cat.id ? 'bg-brand-blue/20 border-brand-blue scale-105 shadow-lg shadow-brand-blue/10' : 'bg-brand-surface-2 border-brand-border hover:border-brand-blue/50 hover:bg-brand-border'}`}>
                                            <span className="text-3xl">{cat.icon}</span>
                                            <span className="text-xs mt-1 text-center break-words text-brand-text-primary font-medium">{cat.name}</span>
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} 
                                        className="flex flex-col items-center justify-center text-center p-2 rounded-lg border-2 border-dashed border-brand-text-secondary/50 text-brand-text-secondary hover:bg-brand-border hover:border-solid hover:text-white transition-all h-24">
                                        <PlusIcon className="w-6 h-6" />
                                        <span className="text-xs mt-1">New</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-brand-border flex justify-end space-x-3 flex-shrink-0">
                            <button type="button" onClick={onClose} className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors">Cancel</button>
                            <button type="submit" disabled={!description || !selectedCategory || parseFloat(amount) <= 0} className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                                {isEditing ? 'Save Changes' : 'Save Income'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <CategoryModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={handleSaveCategory}
                category={null}
            />
        </>
    )
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + tzOffset).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

const IncomeCard: React.FC<{
    income: Income;
    onEdit: (income: Income) => void;
    onDelete: (income: Income) => void;
    isAnimatingIn: boolean;
    isAnimatingOut: boolean;
    isHighlighted: boolean;
}> = ({ income, onEdit, onDelete, isAnimatingIn, isAnimatingOut, isHighlighted }) => {
    return (
        <motion.div 
            className={`group relative p-4 bg-brand-surface rounded-2xl border border-brand-border flex flex-col cursor-pointer
                ${isHighlighted ? 'animate-highlight' : ''}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{
              y: -8,
              scale: 1.02,
              borderColor: "rgb(59 130 246)",
              boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
              }
            }}
            whileTap={{
              scale: 0.98,
              transition: { duration: 0.1 }
            }}
            layout
            layoutId={`income-${income.id}`}
        >
            
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 min-w-0">
                        <motion.div 
                            className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 relative overflow-hidden bg-blue-500/10"
                            whileHover={{ 
                                scale: 1.1,
                                rotate: 5,
                                backgroundColor: "rgba(59, 130, 246, 0.15)"
                            }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)]"></div>
                            <span className="relative z-10">{income.category.icon}</span>
                        </motion.div>
                        <motion.div 
                            className="min-w-0"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <p className="font-semibold text-base text-brand-text-primary leading-tight truncate" title={income.description}>{income.description}</p>
                            <p className="text-sm text-brand-text-secondary">{income.category.name}</p>
                        </motion.div>
                    </div>
                     <div className="text-right shrink-0 pl-2">
                         <motion.p 
                            className="text-xl font-bold text-blue-400"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                         >
                            +${income.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </motion.p>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-brand-border/50 flex justify-between items-center text-xs text-brand-text-secondary">
                 <div className="flex items-center space-x-1.5">
                    {paymentMethodIcons[income.paymentMethod]}
                    <span>{income.paymentMethod}</span>
                    {income.recurrence && <RefreshIcon className="w-4 h-4 text-blue-400" title="Recurring" />}
                </div>
                 <p className="font-medium">{formatDate(income.date)}</p>
            </div>

            <motion.div 
                className="absolute top-3 right-3 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1 }}
                whileHover={{ scale: 1.05, opacity: 1 }}
            >
                <motion.button 
                    onClick={() => onEdit(income)} 
                    className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border/50 transition-all duration-200" 
                    title={`Edit ${income.description}`}
                    whileHover={{ 
                        scale: 1.1,
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        color: "rgb(59 130 246)"
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <PencilIcon className="w-4 h-4" />
                </motion.button>
                <motion.button 
                    onClick={() => onDelete(income)} 
                    className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border/50 transition-all duration-200 border-l border-brand-border" 
                    title={`Delete ${income.description}`}
                    whileHover={{ 
                        scale: 1.1,
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "rgb(239 68 68)"
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <TrashIcon className="w-4 h-4" />
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

const IncomeListItem: React.FC<{
    income: Income;
    onEdit: (income: Income) => void;
    onDelete: (income: Income) => void;
    isAnimatingIn: boolean;
    isAnimatingOut: boolean;
    isHighlighted: boolean;
}> = ({ income, onEdit, onDelete, isAnimatingIn, isAnimatingOut, isHighlighted }) => {
    return (
        <motion.div 
            className={`group relative px-4 py-3 bg-brand-surface rounded-lg border border-brand-border flex items-center gap-4 cursor-pointer
                ${isHighlighted ? 'animate-highlight' : ''}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{
              scale: 1.01,
              borderColor: "rgb(59 130 246)",
              backgroundColor: "rgba(31, 41, 55, 0.5)",
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
              }
            }}
            whileTap={{
              scale: 0.98,
              transition: { duration: 0.1 }
            }}
            layout
            layoutId={`income-list-${income.id}`}
        >
            
            <motion.div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 relative overflow-hidden bg-blue-500/10"
                whileHover={{ 
                    scale: 1.1,
                    rotate: 5,
                    backgroundColor: "rgba(59, 130, 246, 0.15)"
                }}
                transition={{ type: "spring", stiffness: 400 }}
            >
                <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)]"></div>
                <span className="relative z-10">{income.category.icon}</span>
            </motion.div>
            
            <div className="flex-1 min-w-0 md:grid md:grid-cols-2 md:gap-4 md:items-center">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <p className="font-semibold text-sm text-brand-text-primary truncate" title={income.description}>{income.description}</p>
                    <p className="text-xs text-brand-text-secondary">{income.category.name}</p>
                </motion.div>
                 <div className="hidden md:flex items-center gap-2 text-sm text-brand-text-secondary">
                    {paymentMethodIcons[income.paymentMethod]}
                    <span>{income.paymentMethod}</span>
                    {income.recurrence && <RefreshIcon className="w-4 h-4 text-blue-400" title="Recurring" />}
                </div>
            </div>
            
            <div className="hidden lg:block text-sm text-brand-text-secondary w-32 text-right shrink-0">
                {formatDate(income.date)}
            </div>
            
            <div className="text-right w-32 shrink-0">
                <motion.p 
                    className="text-base font-bold text-blue-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                >
                    +${income.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.p>
            </div>
            
            <motion.div 
                className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1 }}
                whileHover={{ scale: 1.05, opacity: 1 }}
            >
                <motion.button 
                    onClick={() => onEdit(income)} 
                    className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border/50 transition-all duration-200" 
                    title={`Edit ${income.description}`}
                    whileHover={{ 
                        scale: 1.1,
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        color: "rgb(59 130 246)"
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <PencilIcon className="w-4 h-4" />
                </motion.button>
                <motion.button 
                    onClick={() => onDelete(income)} 
                    className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border/50 transition-all duration-200 border-l border-brand-border" 
                    title={`Delete ${income.description}`}
                    whileHover={{ 
                        scale: 1.1,
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "rgb(239 68 68)"
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <TrashIcon className="w-4 h-4" />
                </motion.button>
            </motion.div>
        </motion.div>
    );
};
const IncomePage: React.FC = () => {
    const { incomes, addIncome, updateIncome, deleteIncome } = useData();
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    
    const [animatingInId, setAnimatingInId] = useState<number | null>(null);
    const [animatingOutId, setAnimatingOutId] = useState<number | null>(null);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Card' | 'Cash' | 'Bank'>('All');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    
    const isFlowOpen = isAddingNew || !!editingIncome;
    const { addToast } = useToast();
    
    const filteredIncomes = useMemo(() => {
        return incomes
            .filter(income => {
                if (activeFilter === 'All') return true;
                return income.paymentMethod === activeFilter;
            })
            .filter(income =>
                income.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                income.category.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [incomes, activeFilter, searchQuery]);

    const groupedIncomes = useMemo(() => {
        const groups: Record<string, Income[]> = {};
        filteredIncomes.forEach(income => {
            const dateHeader = getRelativeDateHeader(income.date);
            if (!groups[dateHeader]) {
                groups[dateHeader] = [];
            }
            groups[dateHeader].push(income);
        });
        return Object.entries(groups);
    }, [filteredIncomes]);


    const handleEdit = (income: Income) => {
        setEditingIncome(income);
    };

    const handleDeleteRequest = (income: Income) => {
        setDeletingIncome(income);
    };
    
    const handleConfirmDelete = () => {
        if (deletingIncome) {
            setAnimatingOutId(deletingIncome.id);
            setTimeout(() => {
                deleteIncome(deletingIncome.id);
                setAnimatingOutId(null);
                setDeletingIncome(null);
                addToast(`Income for "${deletingIncome.description}" deleted.`, 'info');
            }, 400);
        }
    };
    
    const handleCloseFlow = () => {
        setIsAddingNew(false);
        setEditingIncome(null);
    };

    const handleSaveIncome = async (incomeData: Omit<Income, 'id'> & { id?: number }) => {
        try {
            if (incomeData.id) { // Update existing
                await updateIncome(incomeData as Income);
                setHighlightedId(incomeData.id);
                addToast('Income updated successfully!', 'success');
                setTimeout(() => setHighlightedId(null), 1200);
            } else { // Create new
                // Ensure selected category has docId (if user just created one inline)
                if (!incomeData.category.docId) {
                    console.warn('Creating income with category missing docId', incomeData.category);
                }
                const { id: _ignore, ...payload } = incomeData as any; // remove transient id if present
                                const createdIncome = await addIncome(payload as Omit<Income, 'id' | 'docId'>) as Income;
                                if (createdIncome) {
                                    setAnimatingInId(createdIncome.id);
                                }
                addToast('New income added successfully!', 'success');
                setTimeout(() => setAnimatingInId(null), 500);
            }
        } catch (e) {
            console.error('Failed to save income', e);
            addToast('Failed to save income', 'error');
        } finally {
            handleCloseFlow();
        }
    };

    type FilterType = 'All' | 'Card' | 'Cash' | 'Bank';
    const filters: FilterType[] = ['All', 'Card', 'Cash', 'Bank'];

    return (
        <>
            <motion.div 
                className="p-8 flex flex-col h-full"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div 
                    className="flex flex-wrap justify-between items-center gap-4 mb-6 flex-shrink-0"
                    variants={headerVariants}
                >
                    <h1 className="text-2xl font-bold text-brand-text-primary">Income</h1>
                     <motion.div 
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                     >
                        {incomes.length > 0 && (
                            <>
                                <motion.div 
                                    className="relative"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-5 h-5" />
                                    <motion.input
                                        type="text"
                                        placeholder="Search incomes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-brand-surface border border-brand-border rounded-lg py-2 pl-10 pr-4 w-52 md:w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                        whileFocus={{
                                          scale: 1.02,
                                          borderColor: "rgb(59 130 246)",
                                          transition: { duration: 0.2 }
                                        }}
                                    />
                                </motion.div>
                                <div className="hidden sm:flex space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                                    {filters.map((filter) => (
                                        <motion.button
                                            key={filter}
                                            onClick={() => setActiveFilter(filter)}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                activeFilter === filter
                                                    ? 'bg-brand-surface-2 text-white shadow-sm'
                                                    : 'text-brand-text-secondary hover:bg-brand-surface-2/50'
                                            }`}
                                            whileHover={{ 
                                                scale: 1.05,
                                                transition: { duration: 0.2 }
                                            }}
                                            whileTap={{ 
                                                scale: 0.95,
                                                transition: { duration: 0.1 }
                                            }}
                                            animate={{
                                                backgroundColor: activeFilter === filter ? "rgba(59, 130, 246, 0.8)" : "transparent"
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 30
                                            }}
                                        >
                                            {filter}
                                        </motion.button>
                                    ))}
                                </div>
                                <div className="hidden sm:flex items-center space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                                    <motion.button 
                                        onClick={() => setView('grid')} 
                                        className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-brand-surface-2 text-white' : 'text-brand-text-secondary hover:text-white'}`} 
                                        title="Grid View" 
                                        aria-pressed={view === 'grid'}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <GridIcon className="w-5 h-5" />
                                    </motion.button>
                                    <motion.button 
                                        onClick={() => setView('list')} 
                                        className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-brand-surface-2 text-white' : 'text-brand-text-secondary hover:text-white'}`} 
                                        title="List View" 
                                        aria-pressed={view === 'list'}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ListIcon className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </>
                        )}
                        <motion.button 
                            onClick={() => setIsAddingNew(true)}
                            className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg transition duration-300
                                      shadow-[0_0_20px_rgba(255,255,255,0.1)]
                                      bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]"
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 10px 25px rgba(255, 255, 255, 0.2)",
                                backgroundColor: "rgba(240, 240, 240, 1)"
                            }}
                            whileTap={{
                                scale: 0.95
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25
                            }}
                        >
                            <motion.div
                                whileHover={{ rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <PlusIcon className="w-5 h-5" />
                            </motion.div>
                            <span className="hidden sm:inline">Add New Income</span>
                        </motion.button>
                    </motion.div>
                </motion.div>

                <div className="flex-grow">
                  {incomes.length === 0 ? (
                      <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                      >
                          <EmptyState
                            icon={<EmptyStateIcon />}
                            title="No income recorded"
                            message="Get started by adding your first income source. It will appear here."
                            primaryAction={
                              <motion.button 
                                  onClick={() => setIsAddingNew(true)}
                                  className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300
                                                shadow-[0_0_20px_rgba(255,255,255,0.1)]
                                                bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  animate={{ 
                                    boxShadow: [
                                      "0 0 20px rgba(255,255,255,0.1)",
                                      "0 0 30px rgba(255,255,255,0.3)",
                                      "0 0 20px rgba(255,255,255,0.1)"
                                    ]
                                  }}
                                  transition={{ 
                                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                  }}
                              >
                                  <PlusIcon className="w-5 h-5" />
                                  <span>Add First Income</span>
                              </motion.button>
                            }
                          />
                      </motion.div>
                  ) : filteredIncomes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <EmptyState
                                icon={<EmptyStateIcon />}
                                title={searchQuery ? 'No Results Found' : `No ${activeFilter} income`}
                                message={
                                    searchQuery 
                                    ? <>Your search for "{searchQuery}" did not return any results.</>
                                    : <>There is no income that matches the selected filter.</>
                                }
                                primaryAction={
                                <button 
                                    onClick={() => {
                                        if (searchQuery) setSearchQuery('');
                                        else setActiveFilter('All');
                                    }}
                                    className="flex items-center space-x-2 bg-brand-surface-2 border border-brand-border font-bold py-2 px-4 rounded-lg hover:bg-brand-border transition duration-300">
                                    <span>{searchQuery ? 'Clear Search' : 'Show All Income'}</span>
                                </button>
                                }
                            />
                        </motion.div>
                  ) : (
                    <>
                        {view === 'grid' ? (
                           <motion.div 
                               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                               variants={containerVariants}
                               initial="hidden"
                               animate="visible"
                           >
                               <AnimatePresence mode="popLayout">
                                    {filteredIncomes.map(income => (
                                        <IncomeCard
                                            key={income.id}
                                            income={income}
                                            onEdit={handleEdit}
                                            onDelete={handleDeleteRequest}
                                            isAnimatingIn={animatingInId === income.id}
                                            isAnimatingOut={animatingOutId === income.id}
                                            isHighlighted={highlightedId === income.id}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div 
                                className="space-y-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {groupedIncomes.map(([dateHeader, incomesInGroup]) => (
                                    <motion.div 
                                        key={dateHeader}
                                        variants={itemVariants}
                                    >
                                        <div className="sticky top-0 bg-brand-bg/90 backdrop-blur-sm py-2 z-10 -mx-8 px-8">
                                            <h2 className="text-sm font-semibold text-brand-text-primary border-b border-brand-border pb-2">{dateHeader}</h2>
                                        </div>
                                        <motion.div 
                                            className="space-y-3 pt-2"
                                            variants={containerVariants}
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {incomesInGroup.map(income => (
                                                    <IncomeListItem
                                                        key={income.id}
                                                        income={income}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDeleteRequest}
                                                        isAnimatingIn={animatingInId === income.id}
                                                        isAnimatingOut={animatingOutId === income.id}
                                                        isHighlighted={highlightedId === income.id}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </>
                  )}
                </div>
            </motion.div>
            <IncomeModal 
                isOpen={isFlowOpen} 
                onClose={handleCloseFlow} 
                onSave={handleSaveIncome} 
                incomeToEdit={editingIncome} 
            />
            <ConfirmationModal
                isOpen={!!deletingIncome}
                onClose={() => setDeletingIncome(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Income"
                message={`Are you sure you want to delete the income for "${deletingIncome?.description}"? This action cannot be undone.`}
            />
        </>
    );
};

export default IncomePage;
