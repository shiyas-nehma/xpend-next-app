

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, CreditCardIcon, CashIcon, BankIcon, DocumentTextIcon, MagnifyingGlassIcon, GridIcon, ListIcon, RefreshIcon } from '../../components/icons/NavIcons';
import type { Expense, Category, Recurrence } from '../types';
import CategoryModal from '../../components/category/CategoryModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import EmptyState from '../../components/common/EmptyState';
import EmptyStateIcon from '../../components/icons/EmptyStateIcon';
import { useToast } from '../../hooks/useToast';
import { useData } from '../../hooks/useData';

const paymentMethodIcons: Record<Expense['paymentMethod'], React.ReactNode> = {
  Card: <CreditCardIcon className="w-4 h-4" />,
  Cash: <CashIcon className="w-4 h-4" />,
  Bank: <BankIcon className="w-4 h-4" />,
};

type ScannedExpenseData = {
    description: string;
    amount: number;
    date: string;
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

const ReceiptUploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: ScannedExpenseData) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setImagePreview(null);
            setImageBase64(null);
            setImageMimeType(null);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen]);

    const handleFileChange = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setImageBase64((reader.result as string).split(',')[1]);
                setImageMimeType(file.type);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please select a valid image file.');
        }
    };

    const handleScan = async () => {
        if (!imageBase64 || !imageMimeType) return;
        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
                        { text: "Extract the vendor name (as 'description'), total amount (as 'amount'), and transaction date in YYYY-MM-DD format (as 'date') from this receipt. If a field is not clear, use an empty string for text fields and 0 for the amount." },
                    ],
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING, description: 'The name of the vendor or store.' },
                            amount: { type: Type.NUMBER, description: 'The total amount of the transaction.' },
                            date: { type: Type.STRING, description: 'The date of the transaction in YYYY-MM-DD format.' },
                        },
                        required: ["description", "amount", "date"],
                    },
                },
            });

            const result = JSON.parse(response.text);
            onSuccess(result);
            onClose();
        } catch (e) {
            console.error("AI receipt scanning failed:", e);
            setError("Failed to scan receipt. The image might be unclear. Please try again or enter manually.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in-scale">
            <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-2xl p-8 z-10 
                       border border-transparent 
                       [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(93,120,255,0.5))_border-box]
                       relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)] -z-10"></div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Scan Receipt</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors" disabled={isLoading}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} className="hidden" />
                    {!imagePreview ? (
                        <button onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-brand-border rounded-lg flex flex-col items-center justify-center text-brand-text-secondary hover:border-brand-blue hover:text-white transition-colors">
                            <DocumentTextIcon className="w-10 h-10 mb-2" />
                            <span>Click to upload or drag & drop</span>
                        </button>
                    ) : (
                        <div className="relative w-full h-48 border border-brand-border rounded-lg overflow-hidden group">
                            <img src={imagePreview} alt="Receipt preview" className="w-full h-full object-contain" />
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                    <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
                                    <p className="mt-3 text-sm">Scanning receipt...</p>
                                </div>
                            )}
                            {!isLoading && (
                                <button onClick={() => fileInputRef.current?.click()} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                     {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} disabled={isLoading} className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors disabled:opacity-50">Cancel</button>
                    <button onClick={handleScan} disabled={!imagePreview || isLoading} className="bg-brand-blue text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isLoading ? 'Scanning...' : 'Scan & Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'> & { id?: number }) => void;
    expenseToEdit: Expense | null;
    initialData?: Partial<Omit<Expense, 'id' | 'category'>>;
}> = ({ isOpen, onClose, onSave, expenseToEdit, initialData }) => {
    const isEditing = !!expenseToEdit;
    const { categories, addCategory } = useData();
    const [amount, setAmount] = useState<string>('0.00');
    const [description, setDescription] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('Card');
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
        const resetRecurring = () => {
            setIsRecurring(false);
            setFrequency('Monthly');
            setEndType('Never');
            setOccurrences('12');
            setEndDate('');
        };

        if (expenseToEdit) {
            setAmount(expenseToEdit.amount.toFixed(2));
            setDescription(expenseToEdit.description);
            setPaymentMethod(expenseToEdit.paymentMethod);
            setDate(new Date(expenseToEdit.date).toISOString().split('T')[0]);
            setSelectedCategory(expenseToEdit.category);
             if (expenseToEdit.recurrence) {
                setIsRecurring(true);
                setFrequency(expenseToEdit.recurrence.frequency);
                setEndType(expenseToEdit.recurrence.end.type);
                if (expenseToEdit.recurrence.end.type === 'After' && typeof expenseToEdit.recurrence.end.value === 'number') {
                    setOccurrences(String(expenseToEdit.recurrence.end.value));
                }
                if (expenseToEdit.recurrence.end.type === 'OnDate' && typeof expenseToEdit.recurrence.end.value === 'string') {
                    setEndDate(expenseToEdit.recurrence.end.value);
                }
            } else {
                resetRecurring();
            }
        } else if (initialData) {
            setAmount(initialData.amount?.toFixed(2) || '0.00');
            setDescription(initialData.description || '');
            setPaymentMethod(initialData.paymentMethod || 'Card');
            setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setSelectedCategory(null);
            resetRecurring();
        } else {
            setAmount('0.00');
            setDescription('');
            setPaymentMethod('Card');
            setDate(new Date().toISOString().split('T')[0]);
            setSelectedCategory(null);
            resetRecurring();
        }
    }, [expenseToEdit, initialData, isOpen]);

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

    const handleSaveCategory = (categoryData: Omit<Category, 'id' | 'transactions' | 'amount'> & { id?: number }) => {
        const newCategory: Category = {
            transactions: 0,
            amount: 0,
            ...categoryData,
            id: Date.now(),
        };
        addCategory(newCategory);
        setSelectedCategory(newCategory);
        setIsCategoryModalOpen(false);
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
                id: expenseToEdit?.id,
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
                        <h2 className="text-2xl font-bold text-brand-text-primary">{isEditing ? 'Edit Expense' : 'Add New Expense'}</h2>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                        
                        {/* Non-scrolling part */}
                        <div className="flex-shrink-0">
                            <div className="text-center pt-2 pb-6 border-b border-brand-border">
                                <label className="text-sm font-medium text-brand-text-secondary" htmlFor="expenseAmount">Amount</label>
                                <div className="relative mt-1 flex justify-center items-center">
                                    <span className="text-4xl font-medium text-brand-text-secondary mr-1">$</span>
                                    <input
                                        id="expenseAmount"
                                        type="text"
                                        value={amount === '0.00' ? '' : amount}
                                        onChange={handleAmountChange}
                                        placeholder="0.00"
                                        className="text-7xl font-bold text-brand-text-primary bg-transparent border-none focus:ring-0 text-center w-full p-0 outline-none"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="py-6 space-y-4">
                                <div>
                                    <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="description">For</label>
                                    <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Lunch with client" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
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
                                    <label className="block text-brand-text-secondary text-sm font-medium mb-1">Payment Method</label>
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
                        
                        {/* Scrolling Category Section */}
                        <div className="flex-grow flex flex-col min-h-0 pt-6 border-t border-brand-border">
                            <label className="block text-brand-text-secondary text-sm font-medium mb-3 flex-shrink-0">Category</label>
                            <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
                                    {categories.filter(c => c.type === 'Expense').map(cat => (
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
                                {isEditing ? 'Save Changes' : 'Save Expense'}
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

const ExpenseCard: React.FC<{
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    isAnimatingIn: boolean;
    isAnimatingOut: boolean;
    isHighlighted: boolean;
}> = ({ expense, onEdit, onDelete, isAnimatingIn, isAnimatingOut, isHighlighted }) => {
    return (
        <div className={`group relative p-4 bg-brand-surface rounded-2xl border border-brand-border flex flex-col transition-all duration-300 hover:border-brand-blue hover:shadow-lg hover:shadow-brand-blue/10 hover:-translate-y-1
            ${isAnimatingOut ? 'animate-fade-out-scale' : ''}
            ${isAnimatingIn ? 'animate-fade-in-scale' : ''}
            ${isHighlighted ? 'animate-highlight' : ''}`}>
            
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 relative overflow-hidden bg-red-500/10">
                            <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.2)_0%,_transparent_70%)]"></div>
                            <span className="relative z-10">{expense.category.icon}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-base text-brand-text-primary leading-tight truncate" title={expense.description}>{expense.description}</p>
                            <p className="text-sm text-brand-text-secondary">{expense.category.name}</p>
                        </div>
                    </div>
                     <div className="text-right shrink-0 pl-2">
                         <p className="text-xl font-bold text-red-400">-${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-brand-border/50 flex justify-between items-center text-xs text-brand-text-secondary">
                 <div className="flex items-center space-x-1.5">
                    {paymentMethodIcons[expense.paymentMethod]}
                    <span>{expense.paymentMethod}</span>
                    {expense.recurrence && <RefreshIcon className="w-4 h-4 text-red-400" title="Recurring" />}
                </div>
                 <p className="font-medium">{formatDate(expense.date)}</p>
            </div>

            <div className="absolute top-3 right-3 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button onClick={() => onEdit(expense)} className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors" title={`Edit ${expense.description}`}><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(expense)} className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border transition-colors border-l border-brand-border" title={`Delete ${expense.description}`}><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

const ExpenseListItem: React.FC<{
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    isAnimatingIn: boolean;
    isAnimatingOut: boolean;
    isHighlighted: boolean;
}> = ({ expense, onEdit, onDelete, isAnimatingIn, isAnimatingOut, isHighlighted }) => {
    return (
        <div className={`group relative px-4 py-3 bg-brand-surface rounded-lg border border-brand-border flex items-center gap-4 transition-all duration-300 hover:border-brand-blue hover:bg-brand-surface-2/50
            ${isAnimatingOut ? 'animate-fade-out-scale' : ''}
            ${isAnimatingIn ? 'animate-fade-in-scale' : ''}
            ${isHighlighted ? 'animate-highlight' : ''}`}>
            
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 relative overflow-hidden bg-red-500/10">
                <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.2)_0%,_transparent_70%)]"></div>
                <span className="relative z-10">{expense.category.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0 md:grid md:grid-cols-2 md:gap-4 md:items-center">
                <div>
                    <p className="font-semibold text-sm text-brand-text-primary truncate" title={expense.description}>{expense.description}</p>
                    <p className="text-xs text-brand-text-secondary">{expense.category.name}</p>
                </div>
                 <div className="hidden md:flex items-center gap-2 text-sm text-brand-text-secondary">
                    {paymentMethodIcons[expense.paymentMethod]}
                    <span>{expense.paymentMethod}</span>
                    {expense.recurrence && <RefreshIcon className="w-4 h-4 text-red-400" title="Recurring" />}
                </div>
            </div>
            
            <div className="hidden lg:block text-sm text-brand-text-secondary w-32 text-right shrink-0">
                {formatDate(expense.date)}
            </div>
            
            <div className="text-right w-32 shrink-0">
                <p className="text-base font-bold text-red-400">-${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button onClick={() => onEdit(expense)} className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors" title={`Edit ${expense.description}`}><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(expense)} className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border transition-colors border-l border-brand-border" title={`Delete ${expense.description}`}><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};


const ExpensePage: React.FC = () => {
    const { expenses, addExpense, updateExpense, deleteExpense } = useData();
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    
    const [animatingInId, setAnimatingInId] = useState<number | null>(null);
    const [animatingOutId, setAnimatingOutId] = useState<number | null>(null);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | 'Card' | 'Cash' | 'Bank'>('All');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [initialExpenseData, setInitialExpenseData] = useState<Partial<Omit<Expense, 'id'|'category'>> | undefined>(undefined);

    const isFlowOpen = isAddingNew || !!editingExpense;
    const { addToast } = useToast();
    
    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                if (activeFilter === 'All') return true;
                return expense.paymentMethod === activeFilter;
            })
            .filter(expense =>
                expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.category.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, activeFilter, searchQuery]);

    const groupedExpenses = useMemo(() => {
        const groups: Record<string, Expense[]> = {};
        filteredExpenses.forEach(expense => {
            const dateHeader = getRelativeDateHeader(expense.date);
            if (!groups[dateHeader]) {
                groups[dateHeader] = [];
            }
            groups[dateHeader].push(expense);
        });
        return Object.entries(groups);
    }, [filteredExpenses]);


    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
    };

    const handleDeleteRequest = (expense: Expense) => {
        setDeletingExpense(expense);
    };
    
    const handleConfirmDelete = () => {
        if (deletingExpense) {
            setAnimatingOutId(deletingExpense.id);
            setTimeout(() => {
                deleteExpense(deletingExpense.id);
                setAnimatingOutId(null);
                setDeletingExpense(null);
                addToast(`Expense for "${deletingExpense.description}" deleted.`, 'info');
            }, 400);
        }
    };
    
    const handleCloseFlow = useCallback(() => {
        setIsAddingNew(false);
        setEditingExpense(null);
        setInitialExpenseData(undefined);
    }, []);

    const handleSaveExpense = (expenseData: Omit<Expense, 'id'> & { id?: number }) => {
        if (expenseData.id) { // Update
            updateExpense(expenseData as Expense);
            setHighlightedId(expenseData.id);
            addToast('Expense updated successfully!', 'success');
            setTimeout(() => setHighlightedId(null), 1200); // Corresponds to animation-highlight duration
        } else { // Create
            const newExpense: Expense = {
                ...expenseData,
                id: Date.now(),
            };
            addExpense(newExpense);
            setAnimatingInId(newExpense.id);
            addToast('New expense added successfully!', 'success');
            setTimeout(() => setAnimatingInId(null), 500); // Corresponds to animate-fade-in-scale duration
        }
        handleCloseFlow();
    };

    const handleScanSuccess = useCallback((data: ScannedExpenseData) => {
        setInitialExpenseData({
            description: data.description,
            amount: data.amount,
            date: data.date,
        });
        setIsReceiptModalOpen(false);
        setIsAddingNew(true);
        addToast('Receipt scanned successfully!', 'success');
    }, []);

    type FilterType = 'All' | 'Card' | 'Cash' | 'Bank';
    const filters: FilterType[] = ['All', 'Card', 'Cash', 'Bank'];

    return (
        <>
            <div className="p-8 flex flex-col h-full">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-brand-text-primary">Expense</h1>
                     <div className="flex items-center gap-2 md:gap-4">
                        {expenses.length > 0 && (
                            <>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search expenses..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-brand-surface border border-brand-border rounded-lg py-2 pl-10 pr-4 w-40 sm:w-52 md:w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                    />
                                </div>
                                <div className="hidden sm:flex space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                                    {filters.map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setActiveFilter(filter)}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                activeFilter === filter
                                                    ? 'bg-brand-surface-2 text-white shadow-sm'
                                                    : 'text-brand-text-secondary hover:bg-brand-surface-2/50'
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                                <div className="hidden sm:flex items-center space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                                    <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-brand-surface-2 text-white' : 'text-brand-text-secondary hover:text-white'}`} title="Grid View" aria-pressed={view === 'grid'}>
                                        <GridIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-brand-surface-2 text-white' : 'text-brand-text-secondary hover:text-white'}`} title="List View" aria-pressed={view === 'list'}>
                                        <ListIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        )}
                        <button 
                            onClick={() => setIsReceiptModalOpen(true)}
                            className="flex items-center space-x-2 bg-brand-surface-2 border border-brand-border text-sm font-bold py-2 px-3 rounded-lg hover:bg-brand-border transition-colors">
                            <DocumentTextIcon className="w-5 h-5" />
                            <span className="hidden lg:inline">Add from Receipt</span>
                        </button>
                        <button 
                            onClick={() => setIsAddingNew(true)}
                            className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-3 rounded-lg hover:bg-gray-200 transition duration-300
                                      shadow-[0_0_20px_rgba(255,255,255,0.1)]
                                      bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden lg:inline">Add New</span>
                        </button>
                    </div>
                </div>

                <div className="flex-grow">
                  {expenses.length === 0 ? (
                      <EmptyState
                        icon={<EmptyStateIcon />}
                        title="No expenses recorded"
                        message="Get started by adding your first transaction. It will appear here."
                        primaryAction={
                          <button 
                              onClick={() => setIsAddingNew(true)}
                              className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300
                                            shadow-[0_0_20px_rgba(255,255,255,0.1)]
                                            bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                              <PlusIcon className="w-5 h-5" />
                              <span>Add First Expense</span>
                          </button>
                        }
                      />
                  ) : filteredExpenses.length === 0 ? (
                        <EmptyState
                            icon={<EmptyStateIcon />}
                            title={searchQuery ? 'No Results Found' : `No ${activeFilter} expenses`}
                            message={
                                searchQuery 
                                ? <>Your search for "{searchQuery}" did not return any results.</>
                                : <>There are no expenses that match the selected filter.</>
                            }
                            primaryAction={
                            <button 
                                onClick={() => {
                                    if (searchQuery) setSearchQuery('');
                                    else setActiveFilter('All');
                                }}
                                className="flex items-center space-x-2 bg-brand-surface-2 border border-brand-border font-bold py-2 px-4 rounded-lg hover:bg-brand-border transition duration-300">
                                <span>{searchQuery ? 'Clear Search' : 'Show All Expenses'}</span>
                            </button>
                            }
                        />
                  ) : (
                    <>
                        {view === 'grid' ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredExpenses.map(expense => (
                                    <ExpenseCard
                                        key={expense.id}
                                        expense={expense}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteRequest}
                                        isAnimatingIn={animatingInId === expense.id}
                                        isAnimatingOut={animatingOutId === expense.id}
                                        isHighlighted={highlightedId === expense.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {groupedExpenses.map(([dateHeader, expensesInGroup]) => (
                                    <div key={dateHeader}>
                                        <div className="sticky top-0 bg-brand-bg/90 backdrop-blur-sm py-2 z-10 -mx-8 px-8">
                                             <h2 className="text-sm font-semibold text-brand-text-primary border-b border-brand-border pb-2">{dateHeader}</h2>
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            {expensesInGroup.map(expense => (
                                                <ExpenseListItem
                                                    key={expense.id}
                                                    expense={expense}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDeleteRequest}
                                                    isAnimatingIn={animatingInId === expense.id}
                                                    isAnimatingOut={animatingOutId === expense.id}
                                                    isHighlighted={highlightedId === expense.id}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                  )}
                </div>
            </div>
            <ExpenseModal 
                isOpen={isFlowOpen} 
                onClose={handleCloseFlow} 
                onSave={handleSaveExpense} 
                expenseToEdit={editingExpense}
                initialData={initialExpenseData} 
            />
            <ReceiptUploadModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                onSuccess={handleScanSuccess}
            />
            <ConfirmationModal
                isOpen={!!deletingExpense}
                onClose={() => setDeletingExpense(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Expense"
                message={`Are you sure you want to delete the expense for "${deletingExpense?.description}"? This action cannot be undone.`}
            />
        </>
    );
};

export default ExpensePage;