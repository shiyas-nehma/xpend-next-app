'use client'

import React from 'react';
import { Logo } from '@/components/icons/NavIcons';

interface HeaderProps {
    onEnterApp: (page: 'login' | 'signup') => void;
    onNavigateToBlog: () => void;
}

const Header: React.FC<HeaderProps> = ({ onEnterApp, onNavigateToBlog }) => {
    const navLinks = ['Features', 'Pricing', 'Testimonials'];

    return (
        <header className="sticky top-0 z-30 w-full bg-brand-bg/80 backdrop-blur-lg border-b border-brand-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Logo />
                        <span className="ml-3 text-xl font-bold">Equota</span>
                    </div>
                    <nav className="hidden md:flex md:space-x-8">
                        {navLinks.map(link => (
                            <a key={link} href={`#${link.toLowerCase()}`} className="text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                                {link}
                            </a>
                        ))}
                        <button onClick={onNavigateToBlog} className="text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                            Blog
                        </button>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => onEnterApp('login')} className="text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                            Sign In
                        </button>
                        <button onClick={() => onEnterApp('signup')} className="px-4 py-2 text-sm font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
