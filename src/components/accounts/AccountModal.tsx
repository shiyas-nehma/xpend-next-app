import React, { useState, useEffect } from 'react';
import type { Account } from '@/types';
import { XIcon } from '@/components/icons/NavIcons';
import { motion, AnimatePresence } from 'framer-motion';

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

        const accountData: any = {
            name,
            type,
            institution,
            balance: finalBalance,
        };

        // Only include id if we're editing an existing account
        if (accountToEdit?.id) {
            accountData.id = accountToEdit.id;
        }

        onSave(accountData);
    };
    
    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow numbers and one decimal point
        if (/^\d*\.?\d{0,2}$/.test(value)) {
            setBalance(value);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div 
                        className="w-full max-w-lg bg-brand-surface rounded-2xl shadow-2xl p-8 z-10 
                                   border border-brand-border relative"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30,
                            duration: 0.3 
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div 
                            className="flex justify-between items-center mb-8"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                        >
                            <h2 className="text-2xl font-bold text-brand-text-primary">
                                {accountToEdit ? 'Edit Account' : 'Add New Account'}
                            </h2>
                            <motion.button 
                                onClick={onClose} 
                                className="text-brand-text-secondary hover:text-white transition-colors"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                <XIcon className="w-6 h-6" />
                            </motion.button>
                        </motion.div>
                        
                        <motion.form 
                            onSubmit={handleSubmit} 
                            className="space-y-5"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                            >
                                <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="accountName">
                                    Account Name
                                </label>
                                <motion.input 
                                    type="text" 
                                    id="accountName" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    required 
                                    placeholder="e.g., Chase Checking" 
                                    className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200"
                                    whileFocus={{ 
                                        scale: 1.01,
                                        borderColor: "rgb(59 130 246)",
                                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                                    }}
                                />
                            </motion.div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4, duration: 0.3 }}
                                >
                                    <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="accountType">
                                        Account Type
                                    </label>
                                    <motion.select 
                                        id="accountType" 
                                        value={type} 
                                        onChange={e => setType(e.target.value as Account['type'])} 
                                        className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 h-11 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200"
                                        whileFocus={{ 
                                            scale: 1.01,
                                            borderColor: "rgb(59 130 246)",
                                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                                        }}
                                    >
                                        <option>Checking</option>
                                        <option>Savings</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option>Investment</option>
                                        <option>Loan</option>
                                    </motion.select>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4, duration: 0.3 }}
                                >
                                    <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="institution">
                                        Institution (Optional)
                                    </label>
                                    <motion.input 
                                        type="text" 
                                        id="institution" 
                                        value={institution} 
                                        onChange={e => setInstitution(e.target.value)} 
                                        placeholder="e.g., Chase Bank" 
                                        className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200"
                                        whileFocus={{ 
                                            scale: 1.01,
                                            borderColor: "rgb(59 130 246)",
                                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                                        }}
                                    />
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.3 }}
                            >
                                <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="balance">
                                    {(type === 'Credit Card' || type === 'Loan') ? 'Amount Owed' : 'Current Balance'}
                                </label>
                                <motion.input 
                                    type="text" 
                                    id="balance" 
                                    value={balance} 
                                    onChange={handleBalanceChange} 
                                    required 
                                    placeholder="0.00" 
                                    className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200"
                                    whileFocus={{ 
                                        scale: 1.01,
                                        borderColor: "rgb(59 130 246)",
                                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                                    }}
                                />
                                {(type === 'Credit Card' || type === 'Loan') && (
                                    <motion.p 
                                        className="text-xs text-brand-text-secondary mt-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6, duration: 0.3 }}
                                    >
                                        Enter the amount you owe (will be stored as negative)
                                    </motion.p>
                                )}
                            </motion.div>

                            <motion.div 
                                className="flex gap-3 pt-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.3 }}
                            >
                                <motion.button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="flex-1 py-2 px-4 text-brand-text-secondary border border-brand-border rounded-lg hover:bg-brand-surface-2 transition-colors"
                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button 
                                    type="submit" 
                                    className="flex-1 py-2 px-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]"
                                    whileHover={{ 
                                        scale: 1.02,
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    {accountToEdit ? 'Update Account' : 'Add Account'}
                                </motion.button>
                            </motion.div>
                        </motion.form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AccountModal;