
import React, { useState, useMemo } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BankIcon, CreditCardIcon, ChartLineIcon, DocumentTextIcon, PiggyBankIcon } from '../../components/icons/NavIcons';
import type { Account } from '../types';
import { mockAccounts } from '../../data/mockData';
import AccountModal from '../../components/accounts/AccountModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { useToast } from '../../hooks/useToast';
import EmptyState from '../../components/common/EmptyState';
import EmptyStateIcon from '../../components/icons/EmptyStateIcon';

const accountTypeIcons: Record<Account['type'], React.ReactNode> = {
    'Checking': <BankIcon />,
    'Savings': <PiggyBankIcon />,
    'Credit Card': <CreditCardIcon />,
    'Investment': <ChartLineIcon />,
    'Loan': <DocumentTextIcon />,
};

const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });
};

const NetWorthCard: React.FC<{ accounts: Account[] }> = ({ accounts }) => {
    const netWorth = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
    const assets = useMemo(() => accounts.filter(a => a.balance >= 0).reduce((sum, acc) => sum + acc.balance, 0), [accounts]);
    const liabilities = useMemo(() => accounts.filter(a => a.balance < 0).reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

    return (
        <div className={`bg-brand-surface rounded-2xl p-6 border border-brand-border mb-8
                          relative bg-clip-padding 
                          before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                          before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}>
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-brand-text-primary mb-1">Net Worth</h3>
                    <p className="text-4xl font-bold text-brand-text-primary">{formatCurrency(netWorth)}</p>
                </div>
                <div className="flex gap-4 sm:gap-6 text-right">
                    <div>
                        <p className="text-sm text-brand-text-secondary">Assets</p>
                        <p className="text-xl font-semibold text-green-400">{formatCurrency(assets)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary">Liabilities</p>
                        <p className="text-xl font-semibold text-red-400">{formatCurrency(liabilities)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AccountCard: React.FC<{
    account: Account;
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
}> = ({ account, onEdit, onDelete }) => (
    <div className="group relative p-4 bg-brand-surface rounded-2xl border border-brand-border flex flex-col transition-all duration-300 hover:border-brand-blue hover:shadow-lg hover:shadow-brand-blue/10 hover:-translate-y-1">
        <div className="flex-grow">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-brand-surface-2 text-brand-text-secondary">
                        {accountTypeIcons[account.type]}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-base text-brand-text-primary leading-tight truncate" title={account.name}>{account.name}</p>
                        <p className="text-sm text-brand-text-secondary">{account.institution}</p>
                    </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                    <p className={`text-xl font-bold ${account.balance >= 0 ? 'text-brand-text-primary' : 'text-red-400'}`}>{formatCurrency(account.balance)}</p>
                </div>
            </div>
        </div>
        <div className="mt-4 pt-3 border-t border-brand-border/50 flex justify-between items-center text-xs text-brand-text-secondary">
            <span>{account.type}</span>
            <p>Updated just now</p>
        </div>
        <div className="absolute top-3 right-3 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button onClick={() => onEdit(account)} className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors" title={`Edit ${account.name}`}><PencilIcon className="w-4 h-4" /></button>
            <button onClick={() => onDelete(account)} className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border transition-colors border-l border-brand-border" title={`Delete ${account.name}`}><TrashIcon className="w-4 h-4" /></button>
        </div>
    </div>
);


const AccountsPage: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
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

    const handleSaveAccount = (accountData: Omit<Account, 'id' | 'lastUpdated'> & { id?: number }) => {
        if (accountData.id) {
            setAccounts(accounts.map(a => a.id === accountData.id ? { ...a, ...accountData, lastUpdated: new Date().toISOString() } : a));
            addToast('Account updated successfully!', 'success');
        } else {
            const newAccount: Account = {
                ...accountData,
                id: Date.now(),
                lastUpdated: new Date().toISOString(),
            };
            setAccounts(prev => [...prev, newAccount]);
            addToast('New account added!', 'success');
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (account: Account) => {
        setDeletingAccount(account);
    };

    const handleConfirmDelete = () => {
        if (deletingAccount) {
            setAccounts(accounts.filter(a => a.id !== deletingAccount.id));
            addToast(`Account "${deletingAccount.name}" deleted.`, 'info');
            setDeletingAccount(null);
        }
    };

    return (
        <>
            <div className="p-8 flex flex-col h-full">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-brand-text-primary">Accounts</h1>
                    <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                        <PlusIcon className="w-5 h-5" />
                        <span>Add New Account</span>
                    </button>
                </div>

                <NetWorthCard accounts={accounts} />

                {accounts.length > 0 ? (
                    <div className="space-y-8">
                        {assets.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-brand-text-primary mb-4">Assets</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {assets.map(account => (
                                        <AccountCard key={account.id} account={account} onEdit={handleOpenModal} onDelete={handleDeleteRequest} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {liabilities.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-brand-text-primary mb-4">Liabilities</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {liabilities.map(account => (
                                        <AccountCard key={account.id} account={account} onEdit={handleOpenModal} onDelete={handleDeleteRequest} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <EmptyState
                        icon={<EmptyStateIcon />}
                        title="No Accounts Added"
                        message="Get a complete view of your finances by adding your bank accounts, credit cards, and loans."
                        primaryAction={
                            <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition">
                                <PlusIcon className="w-5 h-5" />
                                Add Your First Account
                            </button>
                        }
                    />
                )}
            </div>
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
        </>
    );
};

export default AccountsPage;
