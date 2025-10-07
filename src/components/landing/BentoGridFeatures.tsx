
'use client'
import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { AIIcon, DocumentTextIcon, MagnifyingGlassIcon, UserCircleIcon, GoalIcon } from '@/components/icons/NavIcons';

// Base card component for consistent styling
const BentoCard: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = '', children }) => (
  <div className={`bento-card rounded-2xl p-6 flex flex-col ${className}`}>
    {children}
  </div>
);

// Specific feature cards
const AIChatCard: React.FC = () => {
    const { format } = useCurrency();
    const monthlyTotal = format(1234.56);
    const groceries = format(450.75);
    const entertainment = format(250);
    const shopping = format(320);
    return (
        <BentoCard className="h-full">
            <div className="flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-brand-text-primary mb-2">AI Financial Assistant</h3>
                <p className="text-sm text-brand-text-secondary mb-6">Ask questions about your finances in plain English and get instant, intelligent answers.</p>
                <div className="bg-brand-bg/50 rounded-lg p-3 text-sm space-y-4 flex-grow flex flex-col border border-brand-border">
                    <div className="flex gap-3">
                        <UserCircleIcon className="w-8 h-8 text-brand-text-secondary flex-shrink-0" />
                        <p className="bg-brand-surface-2 rounded-lg p-3">Summarize my spending last month.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center flex-shrink-0">
                            <AIIcon className="w-5 h-5 text-brand-text-secondary" />
                        </div>
                        <div className="bg-brand-surface-2 rounded-lg p-3 space-y-2">
                            <p>Last month, you spent a total of <strong>{monthlyTotal}</strong>. Your top categories were:</p>
                            <ul className="list-disc list-inside text-brand-text-secondary space-y-1">
                                <li>Groceries: {groceries}</li>
                                <li>Entertainment: {entertainment}</li>
                                <li>Shopping: {shopping}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-auto pt-4">
                        <div className="relative">
                            <input type="text" placeholder="Ask a question..." className="w-full bg-brand-surface border border-brand-border rounded-lg py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-brand-blue">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BentoCard>
    );
};

const TransactionListCard: React.FC = () => {
    const { format } = useCurrency();
    const groceries = format(112.5, { signDisplay: 'always' }).replace('+', '-'); // ensure negative for expense
    const freelance = format(850, { signDisplay: 'always' });
    const movie = format(35, { signDisplay: 'always' }).replace('+', '-');
    return (
        <BentoCard>
            <h3 className="text-xl font-bold text-brand-text-primary mb-2">Unified Transactions</h3>
            <p className="text-sm text-brand-text-secondary mb-4">See all your income and expenses in one clean feed. Filter, search, and understand your cash flow.</p>
            <div className="bg-brand-bg/50 rounded-lg px-3 py-2 space-y-2 flex-grow border border-brand-border">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                    <input type="text" placeholder="Search transactions" className="w-full bg-brand-surface-2 border border-brand-border rounded-md py-1.5 pl-9 pr-3 text-xs" />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 bg-brand-surface/70 p-2 rounded-md border border-brand-border">
                        <span className="text-xl">🛒</span>
                        <div className="text-xs flex-grow">
                            <p className="font-semibold text-brand-text-primary">Weekly Groceries</p>
                            <p className="text-red-400">-{groceries.replace('-', '')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-brand-surface/70 p-2 rounded-md border border-brand-border">
                        <span className="text-xl">💻</span>
                        <div className="text-xs flex-grow">
                            <p className="font-semibold text-brand-text-primary">Freelance Project</p>
                            <p className="text-blue-400">{freelance}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-brand-surface/70 p-2 rounded-md border border-brand-border opacity-60">
                        <span className="text-xl">🎬</span>
                        <div className="text-xs flex-grow">
                            <p className="font-semibold text-brand-text-primary">Movie Tickets</p>
                            <p className="text-red-400">-{movie.replace('-', '')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </BentoCard>
    );
};

const BudgetControlCard: React.FC = () => {
    const { format } = useCurrency();
    const spent = format(450.75);
    const total = format(600);
    return (
        <BentoCard>
            <h3 className="text-lg font-bold text-brand-text-primary mb-1">Smart Budgeting</h3>
            <p className="text-xs text-brand-text-secondary mb-4">Set monthly budgets for categories and track your spending in real-time.</p>
            <div className="bg-brand-bg/50 rounded-lg p-3 border border-brand-border mt-auto">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold">Food Budget</span>
                    <span className="text-xs font-bold text-yellow-400">{spent} / {total}</span>
                </div>
                <div className="mock-slider-track">
                    <div className="mock-slider-progress w-[75%] bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                </div>
            </div>
        </BentoCard>
    );
};

const AIReceiptScanCard: React.FC = () => (
    <BentoCard>
        <h3 className="text-lg font-bold text-brand-text-primary mb-1">AI Receipt Scan</h3>
        <p className="text-xs text-brand-text-secondary mb-4">Snap a photo, and let our AI automatically log your expense. No more manual entry.</p>
        <div className="bg-brand-bg/50 rounded-lg p-3 flex items-center justify-between border border-brand-border mt-auto">
            <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-brand-text-secondary" />
                <span className="text-xs font-semibold">Scan Receipt</span>
            </div>
            <div className="w-10 h-5 bg-brand-blue rounded-full p-0.5 flex items-center">
                <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
            </div>
        </div>
    </BentoCard>
);

const GoalTrackingCard: React.FC = () => (
    <BentoCard>
        <h3 className="text-lg font-bold text-brand-text-primary mb-1">Goal Tracking</h3>
        <p className="text-xs text-brand-text-secondary mb-4">Set financial goals and visualize your progress towards achieving them.</p>
        <div className="bg-brand-bg/50 rounded-lg p-3 border border-brand-border mt-auto">
            <div className="flex items-center gap-2 mb-1">
                <GoalIcon className="w-5 h-5 text-brand-text-secondary" />
                <span className="text-xs font-semibold">Vacation Fund</span>
            </div>
            <div className="mock-slider-track">
                <div className="mock-slider-progress w-[60%]"></div>
            </div>
             <p className="text-[10px] text-brand-text-secondary text-right mt-1">60% Complete</p>
        </div>
    </BentoCard>
);


// Main Bento Grid Component
const BentoGridFeatures: React.FC = () => {
    return (
        <section id="features" className="py-20 md:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <div className="inline-block bg-brand-surface-2 text-sm font-semibold text-brand-blue px-4 py-1.5 rounded-full mb-4 border border-brand-border">
                        Powerful Features
                     </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-text-primary">A Smarter Dashboard for Your Finances</h2>
                    <p className="max-w-xl mx-auto text-md text-brand-text-secondary mt-4">
                        Equota is an intelligent system designed to give you a complete, actionable overview of your financial life.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 lg:row-span-2">
                        <AIChatCard />
                    </div>
                    <div className="lg:col-span-3">
                        <TransactionListCard />
                    </div>
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <AIReceiptScanCard />
                        <BudgetControlCard />
                        <GoalTrackingCard />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default BentoGridFeatures;
