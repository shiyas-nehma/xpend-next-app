'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import SettingsCard from './SettingsCard';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { updateUserProfile, getUserProfile } from '@/lib/firebase/auth';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@/components/icons/NavIcons';

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
    const { user, loading: authLoading } = useAuth();
    const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        bio: '',
        photoURL: ''
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize form data with user information
    useEffect(() => {
        if (user && !authLoading) {
            const profile = getUserProfile();
            if (profile) {
                setFormData({
                    fullName: profile.displayName || '',
                    username: `@${profile.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                    email: profile.email || '',
                    bio: '',
                    photoURL: profile.photoURL || ''
                });
                
                // Set currency from localStorage or default to USD
                const savedCurrency = localStorage.getItem('userCurrency');
                if (savedCurrency) {
                    const currency = currencies.find(c => c.code === savedCurrency);
                    if (currency) {
                        setSelectedCurrency(currency);
                    }
                }
            }
        }
    }, [user, authLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (1MB max)
            if (file.size > 1024 * 1024) {
                addToast('Image size must be less than 1MB', 'error');
                return;
            }

            // Check file type
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
                addToast('Please select a valid image file (JPG, PNG, or GIF)', 'error');
                return;
            }

            // Create a preview URL
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, photoURL: imageUrl }));
            
            // In a real app, you would upload this to Firebase Storage or another service
            // For now, we'll just use the local preview
            addToast('Image uploaded successfully!', 'success');
        }
    };

    const handleSaveChanges = async () => {
        if (!user) {
            addToast('No user logged in', 'error');
            return;
        }

        // Validate required fields
        if (!formData.fullName.trim()) {
            addToast('Full name is required', 'error');
            return;
        }

        if (!formData.email.trim()) {
            addToast('Email is required', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            addToast('Please enter a valid email address', 'error');
            return;
        }

        setLoading(true);
        try {
            await updateUserProfile({
                displayName: formData.fullName,
                email: formData.email,
                photoURL: formData.photoURL
            });
            
            // Save currency preference to localStorage
            localStorage.setItem('userCurrency', selectedCurrency.code);
            
            addToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Profile update error:', error);
            addToast(
                error instanceof Error ? error.message : 'Failed to update profile', 
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredCurrencies = useMemo(() => {
        if (!searchTerm) return currencies;
        return currencies.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    // Calculate profile completion percentage
    const profileCompletion = useMemo(() => {
        const fields = [
            formData.fullName.trim(),
            formData.email.trim(),
            formData.photoURL.trim(),
            formData.bio.trim(),
            selectedCurrency.code
        ];
        const completedFields = fields.filter(field => field).length;
        return Math.round((completedFields / fields.length) * 100);
    }, [formData, selectedCurrency]);

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

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 's',
            ctrl: true,
            callback: () => {
                if (!loading && !authLoading) {
                    handleSaveChanges();
                }
            }
        },
        {
            key: 'escape',
            callback: () => {
                if (isDropdownOpen) {
                    setIsDropdownOpen(false);
                }
            }
        }
    ]);


    return (
        <SettingsCard 
            title="Profile"
            footer={
                <>
                    <button 
                        type="button"
                        className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors"
                        onClick={() => {
                            // Reset form to original values
                            const profile = getUserProfile();
                            if (profile) {
                                setFormData({
                                    fullName: profile.displayName || '',
                                    username: `@${profile.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                                    email: profile.email || '',
                                    bio: '',
                                    photoURL: profile.photoURL || ''
                                });
                            }
                        }}
                    >
                        Cancel
                    </button>
                     <button 
                        onClick={handleSaveChanges}
                        disabled={loading || authLoading}
                        className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors
                               shadow-[0_0_10px_rgba(255,255,255,0.1)]
                               bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]
                               disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                        {!loading && (
                            <span className="text-xs opacity-60">⌘S</span>
                        )}
                    </button>
                </>
            }
        >
            {authLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-brand-text-secondary">Loading profile...</div>
                </div>
            ) : (
                <>
                    {/* Profile Completion Indicator */}
                    <div className="mb-6 p-4 bg-brand-surface-2 border border-brand-border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-brand-text-primary">Profile Completion</span>
                            <span className="text-sm text-brand-text-secondary">{profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-brand-border rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-brand-blue to-blue-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${profileCompletion}%` }}
                            />
                        </div>
                        {profileCompletion < 100 && (
                            <p className="text-xs text-brand-text-secondary mt-2">
                                Complete your profile to get the most out of Xpend
                            </p>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <img 
                                src={formData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'User')}&background=3b82f6&color=ffffff&size=64`} 
                                alt="Profile" 
                                className="w-16 h-16 rounded-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'User')}&background=3b82f6&color=ffffff&size=64`;
                                }}
                            />
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-brand-surface-2 border border-brand-border text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-border transition-colors"
                            >
                                Change photo
                            </button>
                            <p className="text-xs text-brand-text-secondary mt-2">JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="fullName">Full Name</label>
                        <input 
                            type="text" 
                            id="fullName" 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" 
                        />
                    </div>

                     <div>
                        <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="username">Username</label>
                        <input 
                            type="text" 
                            id="username" 
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" 
                        />
                    </div>

                    <div>
                        <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" 
                        />
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
                        <textarea 
                            id="bio" 
                            name="bio"
                            rows={3}
                            value={formData.bio}
                            onChange={handleInputChange}
                            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none" 
                            placeholder="Tell us about yourself..."
                        />
                    </div>
                </>
            )}
        </SettingsCard>
    );
};

export default ProfileSettings;