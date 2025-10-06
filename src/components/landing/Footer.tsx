'use client'

import React from 'react';
import { Logo } from '../icons/NavIcons';

interface FooterProps {
    onNavigateToBlog: () => void;
}

const FooterLink: React.FC<{ href?: string; onClick?: () => void; children: React.ReactNode }> = ({ href, onClick, children }) => {
    const commonClasses = "text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors";
    if (onClick) {
        return <button onClick={onClick} className={commonClasses}>{children}</button>;
    }
    return <a href={href} className={commonClasses}>{children}</a>;
};


const Footer: React.FC<FooterProps> = ({ onNavigateToBlog }) => {
    return (
        <footer className="border-t border-brand-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1">
                        <div className="flex items-center">
                            <Logo />
                            <span className="ml-3 text-xl font-bold">Equota</span>
                        </div>
                        <p className="mt-4 text-sm text-brand-text-secondary">Your financial clarity, simplified.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3">
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-4">Product</h4>
                            <ul className="space-y-3">
                                <li><FooterLink href="#features">Features</FooterLink></li>
                                <li><FooterLink href="#pricing">Pricing</FooterLink></li>
                                <li><FooterLink href="#">Integrations</FooterLink></li>
                                <li><FooterLink href="#">Updates</FooterLink></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-4">Company</h4>
                            <ul className="space-y-3">
                                <li><FooterLink href="#">About Us</FooterLink></li>
                                <li><FooterLink href="#">Careers</FooterLink></li>
                                <li><FooterLink onClick={onNavigateToBlog}>Blog</FooterLink></li>
                                <li><FooterLink href="#">Contact</FooterLink></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-4">Legal</h4>
                            <ul className="space-y-3">
                                <li><FooterLink href="#">Privacy Policy</FooterLink></li>
                                <li><FooterLink href="#">Terms of Service</FooterLink></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-brand-border text-center text-sm text-brand-text-secondary">
                    &copy; {new Date().getFullYear()} Equota, Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
