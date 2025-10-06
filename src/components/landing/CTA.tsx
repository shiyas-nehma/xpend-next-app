'use client'

import React from 'react';

interface CTAProps {
    onEnterApp: (page: 'signup') => void;
}

const CTA: React.FC<CTAProps> = ({ onEnterApp }) => {
    return (
        <section className="py-20 md:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative p-10 md:p-16 bg-brand-surface border border-brand-border rounded-2xl overflow-hidden text-center">
                    <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(93,120,255,0.2)_0%,_transparent_60%)] scale-150 animate-[pulse_8s_ease-in-out_infinite]"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-brand-text-primary">Ready to take control?</h2>
                        <p className="max-w-xl mx-auto text-md text-brand-text-secondary mt-4 mb-8">
                            Join thousands of satisfied users and start your journey to financial clarity today.
                        </p>
                        <button onClick={() => onEnterApp('signup')} className="px-8 py-3 text-lg font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                            Sign Up Now
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
