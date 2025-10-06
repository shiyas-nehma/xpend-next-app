'use client'

import React from 'react';

const FeatureIconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-12 h-12 bg-brand-surface-2 border border-brand-border rounded-lg flex items-center justify-center mb-4">
        {children}
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl">
        <FeatureIconWrapper>{icon}</FeatureIconWrapper>
        <h3 className="text-lg font-bold text-brand-text-primary mb-2">{title}</h3>
        <p className="text-sm text-brand-text-secondary">{description}</p>
    </div>
);

const Features: React.FC = () => {
    const featuresData = [
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
            title: 'Transaction Tracking',
            description: 'Log every income and expense effortlessly. See where your money goes in real-time.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5zM7 13h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h5z" /></svg>,
            title: 'Smart Categorization',
            description: 'Our AI automatically sorts your transactions into clear, understandable categories.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            title: 'Intuitive Budgeting',
            description: 'Create and stick to budgets that work for you. Get alerts before you overspend.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            title: 'AI-Powered Insights',
            description: 'Receive personalized tips and forecasts to help you save more and spend smarter.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            title: 'Detailed Reports',
            description: 'Visualize your financial health with comprehensive charts and exportable reports.'
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
            title: 'Bank-Level Security',
            description: 'Your data is encrypted and protected with the highest security standards.'
        }
    ];

    return (
        <section id="features" className="py-20 md:py-28 bg-brand-surface/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-text-primary">Everything you need, nothing you don't.</h2>
                    <p className="max-w-xl mx-auto text-md text-brand-text-secondary mt-4">
                        Powerful features designed to give you a complete picture of your financial life.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuresData.map(feature => (
                        <FeatureCard key={feature.title} {...feature} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
