'use client';

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { motion } from 'framer-motion';
import { WalletIcon, GoalIcon, AIIcon, PlusIcon } from '@/components/icons/OnboardingIcons';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-brand-surface rounded-2xl p-4 border border-brand-border ${className}`}>
        {children}
    </div>
);

export const WelcomeVisual: React.FC = () => (
    <div className="w-40 h-40 bg-brand-surface rounded-full flex items-center justify-center border-4 border-brand-border">
        <WalletIcon />
    </div>
);

export const TransactionsVisual: React.FC = () => {
    const { format } = useCurrency();
    return (
      <Card className="w-72 space-y-2">
        <div className="flex items-center justify-between bg-brand-surface-2 p-2 rounded-lg">
            <span className="text-sm font-medium">Monthly Salary</span>
            <span className="text-sm font-bold text-green-400">+{format(5000)}</span>
        </div>
        <div className="flex items-center justify-between bg-brand-surface-2 p-2 rounded-lg">
            <span className="text-sm font-medium">Groceries</span>
            <span className="text-sm font-bold text-red-400">-{format(112.50)}</span>
        </div>
        <div className="flex items-center justify-between bg-brand-surface-2 p-2 rounded-lg opacity-70">
            <span className="text-sm font-medium">Movie Tickets</span>
            <span className="text-sm font-bold text-red-400">-{format(35)}</span>
        </div>
      </Card>
    );
};

export const BudgetsVisual: React.FC = () => (
    <div className="w-40 h-40 rounded-full flex items-center justify-center bg-brand-surface p-2 border-4 border-brand-border">
        <div 
            className="w-full h-full rounded-full"
            style={{background: 'conic-gradient(#5D78FF 0% 50%, #FFC700 50% 80%, #ef4444 80% 100%)'}}
        >
        </div>
    </div>
);

export const GoalsVisual: React.FC = () => {
    const { format } = useCurrency();
    return (
      <Card className="w-72">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-surface-2 rounded-lg flex items-center justify-center">
                <GoalIcon />
            </div>
            <div>
                <p className="text-sm font-semibold text-left">Vacation Fund</p>
                <p className="text-xs text-brand-text-secondary text-left">{format(3500)} / {format(5000)}</p>
            </div>
        </div>
        <div className="w-full h-2.5 bg-brand-surface-2 rounded-full">
            <motion.div 
                className="h-2.5 bg-brand-blue rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
            />
        </div>
      </Card>
    );
};

export const AIInsightsVisual: React.FC = () => {
    const { format } = useCurrency();
    return (
      <Card className="w-72">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AIIcon />
            </div>
            <div>
                <p className="text-sm font-semibold text-left">AI Insight</p>
                <p className="text-xs text-brand-text-secondary text-left">You could save {format(50)}/month on subscriptions.</p>
            </div>
        </div>
      </Card>
    );
};

export const FinalSetupVisual: React.FC<{ onFinish: () => void }> = ({ onFinish }) => (
    <div className="w-80 space-y-3">
        <button onClick={onFinish} className="w-full text-left p-3 bg-brand-surface hover:bg-brand-surface-2 border border-brand-border rounded-lg transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"><PlusIcon /></div>
            <span className="font-semibold">Add First Expense</span>
        </button>
         <button onClick={onFinish} className="w-full text-left p-3 bg-brand-surface hover:bg-brand-surface-2 border border-brand-border rounded-lg transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400"><PlusIcon /></div>
            <span className="font-semibold">Set Monthly Budget</span>
        </button>
         <button onClick={onFinish} className="w-full text-left p-3 bg-brand-surface hover:bg-brand-surface-2 border border-brand-border rounded-lg transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400"><PlusIcon /></div>
            <span className="font-semibold">Create a Goal</span>
        </button>
    </div>
);
