
'use client'

import React from 'react';

interface HeroProps {
    onEnterApp: (page: 'signup') => void;
}

const Hero: React.FC<HeroProps> = ({ onEnterApp }) => {
    return (
        <section className="py-20 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-brand-text-primary mb-6">
                    Financial Clarity, Powered by AI
                </h1>
                <p className="max-w-3xl mx-auto text-lg text-brand-text-secondary mb-10">
                    Equota is the all-in-one finance dashboard that brings your financial life into focus. Scan receipts, chat with an AI assistant, set smart budgets, and achieve your goals—all in one place.
                </p>
                <button onClick={() => onEnterApp('signup')} className="px-8 py-3 text-lg font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                    Get Started for Free
                </button>

                <div className="mt-16 max-w-5xl mx-auto p-2 bg-brand-surface/50 rounded-2xl border border-brand-border shadow-2xl shadow-brand-blue/10">
                    <div className="aspect-video bg-brand-surface rounded-xl border border-brand-border flex items-center justify-center">
                        <p className="text-brand-text-secondary">[App Dashboard Preview]</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
