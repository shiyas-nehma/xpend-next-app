'use client';

import React, { useState, useMemo } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { PlusIcon, PencilIcon, TrashIcon, BankIcon, CreditCardIcon, ChartLineIcon, DocumentTextIcon, PiggyBankIcon } from '@/components/icons/NavIcons';
import type { Account } from '@/types';
import AccountModal from '@/components/accounts/AccountModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useToast } from '@/hooks/useToast';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/common/EmptyState';
import EmptyStateIcon from '@/components/icons/EmptyStateIcon';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';

const accountTypeIcons: Record<Account['type'], React.ReactNode> = {
    'Checking': <BankIcon />,
    'Savings': <PiggyBankIcon />,
    'Credit Card': <CreditCardIcon />,
    'Investment': <ChartLineIcon />,
    'Loan': <DocumentTextIcon />,
};

// formatting now provided by currency context

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { 
        opacity: 0, 
        y: 20,
        scale: 0.95
    },
    visible: { 
        opacity: 1, 
        y: 0,
        scale: 1
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.95,
        transition: {
            duration: 0.2
        }
    }
};

const NetWorthCard: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const { format } = useCurrency();
    const netWorth = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
    const assets = useMemo(() => accounts.filter(a => a.balance >= 0).reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
    const liabilities = useMemo(() => accounts.filter(a => a.balance < 0).reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

    return (
        <motion.div 
            className={`bg-brand-surface rounded-2xl p-6 border border-brand-border mb-8
                          relative bg-clip-padding 
                          before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                          before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: 0.1
            }}
            whileHover={{
                scale: 1.01,
                transition: { duration: 0.2 }
            }}
        >
            <div className="flex flex-wrap justify-between items-center gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <h3 className="text-lg font-bold text-brand-text-primary mb-1">Net Worth</h3>
                    <motion.p 
                        className="text-4xl font-bold text-brand-text-primary"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                        key={netWorth}
                    >
                        {format(netWorth)}
                    </motion.p>
                </motion.div>
                <motion.div 
                    className="flex gap-4 sm:gap-6 text-right"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <p className="text-sm text-brand-text-secondary">Assets</p>
                        <motion.p 
                            className="text-xl font-semibold text-green-400"
                            key={assets}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {format(assets)}
                        </motion.p>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <p className="text-sm text-brand-text-secondary">Liabilities</p>
                        <motion.p 
                            className="text-xl font-semibold text-red-400"
                            key={liabilities}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {format(liabilities)}
                        </motion.p>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const AccountCard: React.FC<{
    account: Account;
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
}> = ({ account, onEdit, onDelete }) => {
    const { format, symbol } = useCurrency();
    return (
    <motion.div 
        className="group relative p-4 bg-brand-surface rounded-2xl border border-brand-border flex flex-col"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={{
            y: -8,
            scale: 1.02,
            borderColor: "rgb(59 130 246)",
            boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        }}
        whileTap={{
            scale: 0.98,
            transition: { duration: 0.1 }
        }}
        layout
        layoutId={`account-${account.id}`}
    >
        <motion.div 
            className="flex-grow"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                    <motion.div 
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-brand-surface-2 text-brand-text-secondary"
                        whileHover={{ 
                            scale: 1.1,
                            rotate: 5,
                            backgroundColor: "rgba(59, 130, 246, 0.1)"
                        }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        {accountTypeIcons[account.type]}
                    </motion.div>
                    <motion.div 
                        className="min-w-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <p className="font-semibold text-base text-brand-text-primary leading-tight truncate" title={account.name}>{account.name}</p>
                        <p className="text-sm text-brand-text-secondary">{account.institution}</p>
                    </motion.div>
                </div>
                <motion.div 
                    className="text-right shrink-0 pl-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.p 
                        className={`text-xl font-bold ${account.balance >= 0 ? 'text-brand-text-primary' : 'text-red-400'}`}
                        whileHover={{ scale: 1.05 }}
                        key={account.balance}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        {format(account.balance)}
                    </motion.p>
                </motion.div>
            </div>
        </motion.div>
        
        <motion.div 
            className="mt-4 pt-3 border-t border-brand-border/50 flex justify-between items-center text-xs text-brand-text-secondary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <span>{account.type}</span>
            <p>Updated just now</p>
        </motion.div>
        
        <motion.div 
            className="absolute top-3 right-3 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1 }}
            whileHover={{ scale: 1.05, opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <motion.button 
                onClick={() => onEdit(account)} 
                className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border/50 transition-all duration-200" 
                title={`Edit ${account.name}`}
                whileHover={{ 
                    scale: 1.1, 
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    color: "rgb(59 130 246)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                <PencilIcon className="w-4 h-4" />
            </motion.button>
            <motion.button 
                onClick={() => onDelete(account)} 
                className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border/50 transition-all duration-200 border-l border-brand-border" 
                title={`Delete ${account.name}`}
                whileHover={{ 
                    scale: 1.1, 
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "rgb(239 68 68)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                <TrashIcon className="w-4 h-4" />
            </motion.button>
        </motion.div>
    </motion.div>
    );
};

export default function AccountsPage() {
    const { user, loading: authLoading } = useAuth();
    const { 
        accounts, 
        loading: accountsLoading, 
        error, 
        addAccount, 
        updateAccount, 
        deleteAccount 
    } = useAccounts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
    const { addToast } = useToast();

    const assets = useMemo(() => accounts.filter(a => ['Checking', 'Savings', 'Investment'].includes(a.type)), [accounts]);
    const liabilities = useMemo(() => accounts.filter(a => ['Credit Card', 'Loan'].includes(a.type)), [accounts]);

    const handleOpenModal = (account: Account | null) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingAccount(null);
        setIsModalOpen(false);
    };

    const handleSaveAccount = async (accountData: Omit<Account, 'id' | 'lastUpdated'> & { id?: number }) => {
        try {
            if (accountData.id) {
                await updateAccount(accountData.id, accountData);
                addToast('Account updated successfully!', 'success');
            } else {
                await addAccount(accountData);
                addToast('New account added!', 'success');
            }
            handleCloseModal();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            addToast(errorMessage, 'error');
        }
    };

    const handleDeleteRequest = (account: Account) => {
        setDeletingAccount(account);
    };

    const handleConfirmDelete = async () => {
        if (deletingAccount) {
            try {
                await deleteAccount(deletingAccount.id);
                addToast(`Account "${deletingAccount.name}" deleted.`, 'info');
                setDeletingAccount(null);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
                addToast(errorMessage, 'error');
            }
        }
    };

    // Show loading spinner while checking authentication
    if (authLoading) {
        return (
            <motion.div 
                className="p-8 flex justify-center items-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <LoadingSpinner size="large" />
            </motion.div>
        );
    }

    // Show error message if user is not authenticated
    if (!user) {
        return (
            <motion.div 
                className="p-8 flex flex-col items-center justify-center h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <p className="text-brand-text-secondary mb-4">Please log in to view your accounts.</p>
            </motion.div>
        );
    }

    // Show loading spinner while fetching accounts
    if (accountsLoading) {
        return (
            <motion.div 
                className="p-8 flex justify-center items-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <LoadingSpinner size="large" />
            </motion.div>
        );
    }

    // Show error message if there's an error
    if (error) {
        return (
            <motion.div 
                className="p-8 flex flex-col items-center justify-center h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <p className="text-red-400 mb-4">Error: {error}</p>
                
                <motion.button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-opacity-80"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    Try Again
                </motion.button>
            </motion.div>
        );
    }

    const content = (
        <motion.div
            className="p-8 flex flex-col h-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div 
                className="flex flex-wrap justify-between items-center gap-4 mb-6"
                variants={itemVariants}
            >
                <h1 className="text-2xl font-bold text-brand-text-primary">Accounts</h1>
                <motion.button 
                    onClick={() => handleOpenModal(null)} 
                    className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]"
                    whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Add New Account</span>
                </motion.button>
            </motion.div>

            <NetWorthCard accounts={accounts} />

            {accounts.length > 0 ? (
                <motion.div 
                    className="space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence mode="wait">
                        {assets.length > 0 && (
                            <motion.div
                                key="assets"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <h2 className="text-xl font-bold text-brand-text-primary mb-4">Assets</h2>
                                <motion.div 
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <AnimatePresence>
                                        {assets.map(account => (
                                            <AccountCard 
                                                key={account.id} 
                                                account={account} 
                                                onEdit={handleOpenModal} 
                                                onDelete={handleDeleteRequest} 
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.div>
                        )}
                        {liabilities.length > 0 && (
                            <motion.div
                                key="liabilities"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <h2 className="text-xl font-bold text-brand-text-primary mb-4">Liabilities</h2>
                                <motion.div 
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <AnimatePresence>
                                        {liabilities.map(account => (
                                            <AccountCard 
                                                key={account.id} 
                                                account={account} 
                                                onEdit={handleOpenModal} 
                                                onDelete={handleDeleteRequest} 
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <EmptyState
                        icon={<EmptyStateIcon />}
                        title="No Accounts Added"
                        message="Get a complete view of your finances by adding your bank accounts, credit cards, and loans."
                        primaryAction={
                            <motion.button 
                                onClick={() => handleOpenModal(null)} 
                                className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                <PlusIcon className="w-5 h-5" />
                                Add Your First Account
                            </motion.button>
                        }
                    />
                </motion.div>
            )}
            
            <AccountModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveAccount}
                accountToEdit={editingAccount}
            />
            <ConfirmationModal
                isOpen={!!deletingAccount}
                onClose={() => setDeletingAccount(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Account"
                message={`Are you sure you want to delete the account "${deletingAccount?.name}"? This action cannot be undone.`}
            />
        </motion.div>
    );

    return (
        <ErrorBoundary>
            {content}
        </ErrorBoundary>
    );
}