
import React, { useState, useEffect } from 'react';
import type { Account } from '../../types';
import { XIcon } from '../icons/NavIcons';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Omit<Account, 'id' | 'lastUpdated'> & { id?: number }) => void;
    accountToEdit: Account | null;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('Checking');
    const [institution, setInstitution] = useState('');
    const [balance, setBalance] = useState('');

    useEffect(() => {
        if (accountToEdit) {
            setName(accountToEdit.name);
            setType(accountToEdit.type);
            setInstitution(accountToEdit.institution || '');
            setBalance(String(Math.abs(accountToEdit.balance))); // Use absolute for editing
        } else {
            setName('');
            setType('Checking');
            setInstitution('');
            setBalance('');
        }
    }, [accountToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalBalance = parseFloat(balance.replace(/[^0-9.]/g, ''));
        if (isNaN(finalBalance)) finalBalance = 0;

        if (type === 'Credit Card' || type === 'Loan') {
            finalBalance = -Math.abs(finalBalance);
        }

        onSave({
            id: accountToEdit?.id,
            name,
            type,
            institution,
            balance: finalBalance,
        });
    };
    
    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow numbers and one decimal point
        if (/^\d*\.?\d{0,2}$/.test(value)) {
            setBalance(value);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-scale">
            <div className="w-full max-w-lg bg-brand-surface rounded-2xl shadow-2xl p-8 z-10 
                   border border-transparent 
                   [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(93,120,255,0.5))_border-box]
                   relative">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-brand-text-primary">{accountToEdit ? 'Edit Account' : 'Add New Account'}</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="accountName">Account Name</label>
                        <input type="text" id="accountName" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Chase Checking" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="accountType">Account Type</label>
                            <select id="accountType" value={type} onChange={e => setType(e.target.value as Account['type'])} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 h-11 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option>Checking</option>
                                <option>Savings</option>
                                <option value="Credit Card">Credit Card</option>
                                <option>Investment</option>
                                <option>Loan</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="institution">Institution (Optional)</label>
                            <input type="text" id="institution" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="e.g., Chase Bank" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="balance">
                           {type === 'Credit Card' || type === 'Loan' ? 'Current Debt' : 'Current Balance'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary">$</span>
                            <input type="text" id="balance" value={balance} onChange={handleBalanceChange} required placeholder="0.00" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg pl-7 pr-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-brand-border flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors">Cancel</button>
                        <button type="submit" className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                            {accountToEdit ? 'Save Changes' : 'Add Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;
