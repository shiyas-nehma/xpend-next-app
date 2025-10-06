

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { 
    PlusIcon, 
    BellIcon, 
    ChevronDownIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    AIIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    LightningBoltIcon
} from '../icons/NavIcons';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import type { Income, Expense } from '../../types';

type Notification = {
    id: number;
    icon: React.ReactNode;
    text: React.ReactNode;
    time: string;
    read: boolean;
};

const mockNotifications: Notification[] = [
    { id: 1, icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />, text: <p>You are about to cross your monthly <strong>food budget</strong>.</p>, time: '15m ago', read: false },
    { id: 2, icon: <CheckCircleIcon className="w-5 h-5 text-green-400" />, text: <p>You saved <strong>10% more</strong> than last month. Keep it up!</p>, time: '2h ago', read: false },
    { id: 3, icon: <InformationCircleIcon className="w-5 h-5 text-blue-400" />, text: <p>A large transaction of <strong>$850.00</strong> was categorized as 'Freelance'.</p>, time: '1d ago', read: false },
    { id: 4, icon: <AIIcon className="w-5 h-5 text-brand-text-secondary" />, text: <p><strong>AI Assistant</strong> sent you a new insight about your budget.</p>, time: '2d ago', read: true },
];

const DNDToggle: React.FC = () => {
  const [isOn, setIsOn] = useState(false);
  return (
    <button
        onClick={() => setIsOn(!isOn)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-brand-blue
                    ${isOn ? 'bg-brand-blue' : 'bg-brand-surface-2'}`}
        role="switch"
        aria-checked={isOn}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${isOn ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
  );
};

const QuickAddBar: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { categories, addIncome, addExpense } = useData();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Parse the following shorthand transaction. The format is generally '[type] [amount] [description] #[category]'. 'exp' means expense, 'inc' means income. If type is omitted, assume expense. Find the single most relevant category name from the text provided after the '#'. The description is the text between the amount and the category tag. User input: "${inputValue}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['income', 'expense'] },
                            amount: { type: Type.NUMBER },
                            description: { type: Type.STRING },
                            categoryName: { type: Type.STRING }
                        },
                        required: ["type", "amount", "description", "categoryName"]
                    }
                }
            });

            const result = JSON.parse(response.text);

            if (!result.amount || !result.description || !result.categoryName) {
                throw new Error("AI could not parse the transaction. Please be more specific.");
            }

            const categoryType = result.type === 'income' ? 'Income' : 'Expense';
            const category = categories.find(c => 
                c.name.toLowerCase() === result.categoryName.toLowerCase() && c.type === categoryType
            );

            if (!category) {
                addToast(`Category "${result.categoryName}" for ${categoryType} not found.`, 'error');
                return;
            }

            const newTransaction = {
                id: Date.now(),
                amount: result.amount,
                description: result.description,
                date: new Date().toISOString(),
                paymentMethod: 'Card', // Default payment method for quick adds
                category: category,
                isRecurring: false
            };

            if (result.type === 'income') {
                addIncome(newTransaction as Income);
                addToast(`Income of $${result.amount.toFixed(2)} added to ${category.name}!`, 'success');
            } else {
                addExpense(newTransaction as Expense);
                addToast(`Expense of $${result.amount.toFixed(2)} added to ${category.name}!`, 'success');
            }
            setInputValue('');

        } catch (error) {
            console.error("Quick Add Error:", error);
            addToast("Couldn't add transaction. Please check your format.", 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="w-full lg:flex-1 lg:max-w-lg lg:order-2">
            <div className="relative w-full">
                <LightningBoltIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-secondary w-5 h-5" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Quick Add: exp 25.50 coffee #groceries"
                    className="bg-brand-surface border border-brand-border rounded-lg py-2.5 pl-11 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    disabled={isLoading}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-text-secondary/50 border-t-brand-blue rounded-full animate-spin"></div>
                )}
            </div>
      </form>
    );
}

const Header: React.FC = () => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const unreadCount = mockNotifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


  return (
    <header className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6">
      {/* Left Section: Title - Order 1 on all screens */}
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-brand-text-primary">Dashboard</h1>
        <ChevronDownIcon className="w-5 h-5 text-brand-text-secondary" />
      </div>

      {/* Right Section: Actions - Order 2 on mobile, Order 3 on lg+ */}
      <div className="flex items-center space-x-2 sm:space-x-4 lg:order-3">
        <div className="relative" ref={notificationsRef}>
            <button 
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className="hidden sm:block text-brand-text-secondary hover:text-white relative bg-brand-surface p-2 rounded-lg border border-brand-border"
            >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-auto min-w-4 items-center justify-center rounded-full bg-brand-blue px-1 text-xs text-white">{unreadCount}</span>
                )}
            </button>
            {isNotificationsOpen && (
                 <div className="absolute top-full right-0 mt-3 w-80 bg-brand-surface border border-brand-border rounded-xl shadow-2xl z-20 animate-fade-in-scale origin-top-right">
                    {/* Header */}
                    <div className="flex justify-between items-center p-3 border-b border-brand-border">
                        <h4 className="font-semibold">Notifications</h4>
                        <button className="text-xs text-brand-blue hover:underline">Mark all as read</button>
                    </div>

                    {/* DND Toggle */}
                    <div className="flex justify-between items-center p-3 border-b border-brand-border">
                        <p className="text-sm">Do not disturb</p>
                        <DNDToggle />
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {mockNotifications.map(n => (
                             <div key={n.id} className={`p-3 flex items-start gap-3 border-b border-brand-border last:border-b-0 hover:bg-brand-surface-2/50 ${!n.read ? '' : 'opacity-60'}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${!n.read ? 'bg-brand-surface-2' : 'bg-transparent'}`}>
                                    {n.icon}
                                </div>
                                <div className="text-sm">
                                    <div className="text-brand-text-primary">{n.text}</div>
                                    <p className="text-xs text-brand-text-secondary mt-1">{n.time}</p>
                                </div>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-brand-blue mt-1.5 flex-shrink-0"></div>}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-brand-border text-center">
                        <button className="text-sm font-semibold text-brand-blue hover:underline">View all notifications</button>
                    </div>
                 </div>
            )}
        </div>

        <div className="hidden md:flex items-center space-x-2 bg-brand-surface border border-brand-border rounded-lg p-2">
            <ChevronLeftIcon className="w-5 h-5 text-brand-text-secondary cursor-pointer" />
            <span className="text-sm font-medium">Today, Apr 8</span>
            <ChevronRightIcon className="w-5 h-5 text-brand-text-secondary cursor-pointer" />
        </div>

        <div className="flex items-center space-x-2">
            <img src="https://i.pravatar.cc/40?u=hossein" alt="User" className="w-10 h-10 rounded-full" />
            <div className="hidden lg:block">
                <p className="font-semibold text-sm">Hossein</p>
                <p className="text-xs text-brand-text-secondary">@user080523</p>
            </div>
            <ChevronDownIcon className="hidden sm:block w-5 h-5 text-brand-text-secondary" />
        </div>
      </div>
      
      {/* Middle Section: Search / Quick Add - Order 3 on mobile, Order 2 on lg+ */}
      <QuickAddBar />
    </header>
  );
};

export default Header;
