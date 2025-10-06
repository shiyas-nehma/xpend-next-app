import React, { useState, useRef, useEffect, useMemo } from 'react';
import SettingsCard from './SettingsCard';
import { useToast } from '../../hooks/useToast';
import { ChevronDownIcon, MagnifyingGlassIcon } from '../icons/NavIcons';

const currencies = [
    { code: 'USD', name: 'United States Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'ZAR', name: 'South African Rand' },
];

const ProfileSettings: React.FC = () => {
    const { addToast } = useToast();
    const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSaveChanges = () => {
        // In a real app, this would be an async call to an API
        addToast('Profile updated successfully!', 'success');
    };

    const filteredCurrencies = useMemo(() => {
        if (!searchTerm) return currencies;
        return currencies.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);
    
    useEffect(() => {
        if (isDropdownOpen) {
            // Reset search term and focus the input when dropdown opens
            setSearchTerm('');
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isDropdownOpen]);


    return (
        <SettingsCard 
            title="Profile"
            footer={
                <>
                    <button className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors">
                        Cancel
                    </button>
                     <button 
                        onClick={handleSaveChanges}
                        className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors
                               shadow-[0_0_10px_rgba(255,255,255,0.1)]
                               bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                        Save Changes
                    </button>
                </>
            }
        >
            <div className="flex items-center space-x-4">
                <img src="https://i.pravatar.cc/64?u=hossein" alt="User" className="w-16 h-16 rounded-full" />
                <div>
                    <button className="bg-brand-surface-2 border border-brand-border text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-border transition-colors">Change photo</button>
                    <p className="text-xs text-brand-text-secondary mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
            </div>

            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="fullName">Full Name</label>
                <input type="text" id="fullName" defaultValue="Hossein" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>

             <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="username">Username</label>
                <input type="text" id="username" defaultValue="@user080523" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>

            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="email">Email</label>
                <input type="email" id="email" defaultValue="hossein@example.com" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>

            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" id="currency-label">Currency</label>
                 <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-left text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue flex justify-between items-center"
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}
                        aria-labelledby="currency-label"
                    >
                        <span>{selectedCurrency.code} - {selectedCurrency.name}</span>
                        <ChevronDownIcon className={`w-4 h-4 text-brand-text-secondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute z-10 top-full mt-1 w-full bg-brand-surface border border-brand-border rounded-lg shadow-lg animate-fade-in-scale origin-top flex flex-col">
                            <div className="p-2 border-b border-brand-border">
                                <div className="relative">
                                     <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-4 h-4" />
                                     <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search currency..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-brand-bg border border-brand-border rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                    />
                                </div>
                            </div>
                            <ul role="listbox" className="max-h-52 overflow-y-auto">
                                {filteredCurrencies.length > 0 ? (
                                    filteredCurrencies.map(currency => (
                                        <li
                                            key={currency.code}
                                            onClick={() => {
                                                setSelectedCurrency(currency);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="px-3 py-2 text-sm text-brand-text-primary hover:bg-brand-border cursor-pointer"
                                            role="option"
                                            aria-selected={selectedCurrency.code === currency.code}
                                        >
                                            <span className="font-semibold">{currency.code}</span> - <span className="text-brand-text-secondary">{currency.name}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-3 py-2 text-sm text-brand-text-secondary text-center">No currencies found.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="bio">Bio</label>
                <textarea id="bio" rows={3} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none" defaultValue="Creative Director and UI/UX Designer."></textarea>
            </div>
        </SettingsCard>
    );
};

export default ProfileSettings;