
'use client'
import React, { useState } from 'react';
import { 
    StarIcon, 
    CheckIcon,
    ChartLineIcon,
    ServerIcon,
    SlidersIcon,
    ChartBarIcon,
    HeadsetIcon,
    AIIcon,
    DocumentTextIcon,
    GoalIcon,
    UsersIcon,
    UserCircleIcon,
    BadgeIcon
} from '@/components/icons/NavIcons';

interface PricingProps {
    onEnterApp: (page: 'signup') => void;
}

const featureIcons = {
    "Basic Transaction Tracking": <ChartLineIcon className="w-4 h-4 text-white/60" />,
    "Connect up to 3 Bank Accounts": <ServerIcon className="w-4 h-4 text-white/60" />,
    "Standard Budgeting Tools": <SlidersIcon className="w-4 h-4 text-white/60" />,
    "Basic Reporting": <ChartBarIcon className="w-4 h-4 text-white/60" />,
    "Email Support": <HeadsetIcon className="w-4 h-4 text-white/60" />,
    
    "Everything in Free Plan": <CheckIcon className="w-4 h-4 text-green-400" />,
    "AI Financial Assistant": <AIIcon className="w-4 h-4 text-white/60" />,
    "AI Receipt Scanning (50/mo)": <DocumentTextIcon className="w-4 h-4 text-white/60" />,
    "Unlimited Bank Accounts": <ServerIcon className="w-4 h-4 text-white/60" />,
    "Advanced Reporting & Analytics": <ChartBarIcon className="w-4 h-4 text-white/60" />,
    "Goal Tracking": <GoalIcon className="w-4 h-4 text-white/60" />,
    "Priority Email Support": <HeadsetIcon className="w-4 h-4 text-white/60" />,
    
    "Everything in Pro Plan": <CheckIcon className="w-4 h-4 text-green-400" />,
    "Multi-User Collaboration (up to 5)": <UsersIcon className="w-4 h-4 text-white/60" />,
    "Shared Budgets & Goals": <UsersIcon className="w-4 h-4 text-white/60" />,
    "Unlimited Receipt Scans": <DocumentTextIcon className="w-4 h-4 text-white/60" />,
    "Dedicated Account Manager": <UserCircleIcon className="w-4 h-4 text-white/60" />,
    "Custom Onboarding": <BadgeIcon className="w-4 h-4 text-white/60" />,
};

const plans = [
    {
        name: 'Free Plan',
        price: { monthly: '$0', annual: '$0' },
        description: 'Perfect for getting started with the essentials of financial tracking and budgeting.',
        buttonText: 'Start for Free',
        features: [
            "Basic Transaction Tracking",
            "Connect up to 3 Bank Accounts",
            "Standard Budgeting Tools",
            "Basic Reporting",
            "Email Support",
        ],
        glowClass: 'from-blue-500',
        iconColor: 'bg-gradient-to-br from-blue-500 to-blue-700',
        buttonType: 'dark',
    },
    {
        name: 'Pro Plan',
        price: { monthly: '$9', annual: '$90' },
        description: 'Unlock AI insights, goal tracking, and advanced features to supercharge your finances.',
        buttonText: 'Start Free 7 Days Trial',
        isPopular: true,
        features: [
            "Everything in Free Plan",
            "AI Financial Assistant",
            "AI Receipt Scanning (50/mo)",
            "Unlimited Bank Accounts",
            "Advanced Reporting & Analytics",
            "Goal Tracking",
            "Priority Email Support",
        ],
        glowClass: 'from-white/80',
        iconColor: 'bg-gradient-to-br from-gray-200 to-gray-400',
        buttonType: 'light',
    },
    {
        name: 'Advance Plan',
        price: { monthly: 'Custom', annual: 'Custom' },
        description: 'For families or small teams who need collaborative tools and dedicated support.',
        buttonText: 'Contact Us',
        features: [
            "Everything in Pro Plan",
            "Multi-User Collaboration (up to 5)",
            "Shared Budgets & Goals",
            "Unlimited Receipt Scans",
            "Dedicated Account Manager",
            "Custom Onboarding",
        ],
        glowClass: 'from-green-500',
        iconColor: 'bg-gradient-to-br from-green-400 to-green-600',
        buttonType: 'dark',
    },
];


type Plan = typeof plans[0];
type FeatureText = keyof typeof featureIcons;

const PricingCard: React.FC<{ plan: Plan; price: string; }> = ({ plan, price }) => {
    return (
        <div className={`relative overflow-hidden rounded-2xl border p-8 flex flex-col h-full bg-[#1C1C1C]/70 backdrop-blur-xl ${plan.isPopular ? 'border-brand-blue' : 'border-brand-border'}`}>
            <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 bg-gradient-radial ${plan.glowClass} to-transparent`}></div>
            <div className={`absolute inset-0 bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(45 45 45 / 0.5)'%3e%3cpath d='M0 .5 L32 .5 M.5 0 L.5 32'/%3e%3c/svg%3e")] opacity-50`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
                {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                        <StarIcon className="w-3 h-3 text-white" /> POPULAR
                    </div>
                )}
                
                <div className={`w-12 h-12 rounded-lg ${plan.iconColor} shadow-lg`}></div>
                
                <h3 className="text-2xl font-semibold text-brand-text-primary mt-6">{plan.name}</h3>
                
                <div className="mt-4">
                    {price === 'Custom' ? (
                        <span className="text-5xl font-bold">{price}</span>
                    ) : (
                        <>
                            <span className="text-5xl font-bold">{price.split('/')[0]}</span>
                            <span className="text-brand-text-secondary">/{price.split('/')[1]}</span>
                        </>
                    )}
                </div>
                
                <p className="text-sm text-brand-text-secondary mt-2 h-12">{plan.description}</p>
                
                <button className={`w-full py-3 rounded-lg font-bold text-sm mt-6 transition-transform hover:scale-[1.02]
                    ${plan.buttonType === 'light' 
                    ? 'bg-white text-black shadow-lg shadow-white/10' 
                    : 'bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20'}`}>
                    {plan.buttonText}
                </button>
                
                <div className="flex items-center gap-4 my-8 text-xs uppercase text-white/40 font-bold tracking-widest">
                    <div className="h-px bg-white/20 flex-grow"></div>
                    <span>Stand out features</span>
                    <div className="h-px bg-white/20 flex-grow"></div>
                </div>
                
                <ul className="space-y-3">
                    {plan.features.map(feature => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-white/80">
                            {featureIcons[feature as FeatureText] || <CheckIcon className="w-4 h-4 text-white/60" />}
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const PricingToggle: React.FC<{isAnnual: boolean, setIsAnnual: (isAnnual: boolean) => void}> = ({ isAnnual, setIsAnnual }) => (
    <div className="relative inline-flex bg-brand-surface p-1 rounded-full border border-brand-border">
        <button onClick={() => setIsAnnual(false)} className={`relative z-10 px-6 py-2 text-sm font-semibold rounded-full transition-colors ${!isAnnual ? 'text-white' : 'text-brand-text-secondary'}`}>
            Bill Monthly
        </button>
        <button onClick={() => setIsAnnual(true)} className={`relative z-10 px-6 py-2 text-sm font-semibold rounded-full transition-colors ${isAnnual ? 'text-white' : 'text-brand-text-secondary'}`}>
            Bill Annually
        </button>
        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-brand-surface-2 rounded-full transition-transform duration-300 ease-in-out
            ${isAnnual ? 'translate-x-[calc(100%+4px)]' : 'translate-x-1'}`}>
        </div>
    </div>
);

const Pricing: React.FC<PricingProps> = ({ onEnterApp }) => {
    const [isAnnual, setIsAnnual] = useState(false);

    const getPrice = (plan: Plan) => {
        if (plan.price.monthly === 'Custom') return 'Custom';
        const price = isAnnual ? plan.price.annual : plan.price.monthly;
        const period = isAnnual ? 'year' : 'month';
        return `${price}/${period}`;
    };

    return (
        <section id="pricing" className="py-20 md:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map(plan => (
                        <PricingCard key={plan.name} plan={plan} price={getPrice(plan)} />
                    ))}
                </div>
                <p className="text-center text-sm text-brand-text-secondary mt-8">
                    Start your journey risk free - No credit card needed
                </p>
            </div>
        </section>
    );
};

export default Pricing;
