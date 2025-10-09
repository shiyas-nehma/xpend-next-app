'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import SettingsCard from './SettingsCard';
import { CreditCardIcon, CalendarIcon, CheckCircleIcon, PlusIcon } from '@/components/icons/NavIcons';
import { SubscriptionPlanService, Plan } from '@/lib/firebase/subscriptionService';
import { UserSubscriptionService, UserSubscription } from '@/lib/services/userSubscriptionService';

const BillingSettings: React.FC = () => {
    const { user } = useAuth();
    const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            
            try {
                // Load user's current subscription
                const subscription = await UserSubscriptionService.getUserSubscription(user.uid);
                setUserSubscription(subscription);
            } catch (error) {
                console.error('Error loading user subscription:', error);
            }
        };

        // Load available subscription plans
        const unsubscribe = SubscriptionPlanService.onPlansChange((plans) => {
            const activePlans = plans.filter(plan => plan.status === 'active');
            setAvailablePlans(activePlans);
            setLoading(false);
        });

        loadData();

        return () => unsubscribe();
    }, [user]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const calculateAnnualPrice = (monthlyPrice: number, discountPct: number) => {
        const annualBase = monthlyPrice * 12;
        return annualBase * (1 - discountPct / 100);
    };

    const handleSelectPlan = async (plan: Plan) => {
        if (!user) return;
        
        try {
            // TODO: Integrate with actual payment processor (Stripe)
            // For now, we'll simulate creating a subscription
            const subscription = await UserSubscriptionService.createSubscription(
                user.uid, 
                plan.id, 
                plan.name, 
                plan.monthlyPrice
            );
            
            setUserSubscription(subscription);
            setShowPlanModal(false);
            
            // In a real app, you would:
            // 1. Redirect to Stripe/payment processor
            // 2. Handle payment success/failure
            // 3. Update subscription status based on payment result
            
            console.log('Subscription created successfully:', subscription);
        } catch (error) {
            console.error('Error creating subscription:', error);
            // Handle error (show toast, etc.)
        }
    };

    if (loading) {
        return (
            <SettingsCard title="Billing & Plans">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
            </SettingsCard>
        );
    }
    return (
        <>
            <SettingsCard 
                title="Billing & Plans"
                footer={
                    <>
                        {userSubscription ? (
                            <button 
                                onClick={() => setShowPlanModal(true)}
                                className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors"
                            >
                                Change Plan
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowPlanModal(true)}
                                className="bg-brand-blue text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Plan
                            </button>
                        )}
                    </>
                }
            >
                {userSubscription ? (
                    // User has active subscription - show current plan and payment method
                    <>
                        <div className="bg-brand-surface-2 border border-brand-border rounded-xl p-4 mb-4">
                            <p className="text-sm text-brand-text-secondary">Current Plan</p>
                            <p className="text-lg font-semibold text-brand-text-primary">{userSubscription.planName}</p>
                            <p className="text-sm text-brand-text-secondary mt-2">
                                Renews on <span className="text-brand-text-primary font-medium">
                                    {userSubscription.endDate.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </span>
                            </p>
                        </div>
                        
                        {userSubscription.paymentMethod && (
                            <div>
                                <h4 className="font-medium text-brand-text-primary mb-2">Payment Method</h4>
                                <div className="flex items-center justify-between bg-brand-surface-2 border border-brand-border rounded-xl p-4">
                                    <div className="flex items-center space-x-3">
                                        <CreditCardIcon className="w-8 h-8 text-brand-text-secondary" />
                                        <div>
                                            <p className="font-medium text-brand-text-primary">
                                                Visa ending in {userSubscription.paymentMethod.last4}
                                            </p>
                                            <p className="text-sm text-brand-text-secondary">
                                                Expires {String(userSubscription.paymentMethod.expiryMonth).padStart(2, '0')}/{userSubscription.paymentMethod.expiryYear}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-sm font-medium text-brand-blue hover:underline">
                                        Update
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // User has no subscription - show empty state with call to action
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-brand-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-8 h-8 text-brand-text-secondary" />
                        </div>
                        <h3 className="text-lg font-medium text-brand-text-primary mb-2">No Active Plan</h3>
                        <p className="text-brand-text-secondary mb-4">
                            Choose a subscription plan to unlock all features and start managing your expenses efficiently.
                        </p>
                        <p className="text-sm text-brand-text-secondary">
                            {availablePlans.length} plan{availablePlans.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                )}
            </SettingsCard>

            {/* Plan Selection Modal */}
            {showPlanModal && (
                <PlanSelectionModal 
                    plans={availablePlans}
                    currentPlan={userSubscription?.planId}
                    onSelectPlan={handleSelectPlan}
                    onClose={() => setShowPlanModal(false)}
                />
            )}
        </>
    );
};

// Plan Selection Modal Component
interface PlanSelectionModalProps {
    plans: Plan[];
    currentPlan?: string;
    onSelectPlan: (plan: Plan) => void;
    onClose: () => void;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ 
    plans, 
    currentPlan, 
    onSelectPlan, 
    onClose 
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const calculateAnnualPrice = (monthlyPrice: number, discountPct: number) => {
        const annualBase = monthlyPrice * 12;
        return annualBase * (1 - discountPct / 100);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-gray-600 mt-2">Select the perfect plan for your expense management needs</p>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrentPlan = currentPlan === plan.id;
                            const isHighlighted = plan.highlight;
                            const annualPrice = plan.annualDiscountPct ? 
                                calculateAnnualPrice(plan.monthlyPrice, plan.annualDiscountPct) : 
                                plan.monthlyPrice * 12;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative border rounded-xl p-6 cursor-pointer transition-all ${
                                        isHighlighted
                                            ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                            : isCurrentPlan
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                    }`}
                                    onClick={() => !isCurrentPlan && onSelectPlan(plan)}
                                >
                                    {isHighlighted && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    {isCurrentPlan && (
                                        <div className="absolute -top-3 right-4">
                                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <div className="mb-2">
                                            <span className="text-3xl font-bold text-gray-900">
                                                {formatCurrency(plan.monthlyPrice)}
                                            </span>
                                            <span className="text-gray-600">/month</span>
                                        </div>
                                        {plan.annualDiscountPct && plan.annualDiscountPct > 0 && (
                                            <div className="text-sm text-green-600">
                                                {formatCurrency(annualPrice)}/year 
                                                <span className="ml-1">({plan.annualDiscountPct}% off annually)</span>
                                            </div>
                                        )}
                                        {plan.trialDays > 0 && (
                                            <div className="text-sm text-blue-600 mt-1">
                                                {plan.trialDays}-day free trial
                                            </div>
                                        )}
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700 text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="border-t pt-4 mb-4">
                                        <h4 className="font-medium text-gray-900 mb-2 text-sm">Feature Limits:</h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <div>Categories: {plan.featureLimits.maxCategories === -1 ? 'Unlimited' : plan.featureLimits.maxCategories}</div>
                                            <div>Accounts: {plan.featureLimits.maxAccounts === -1 ? 'Unlimited' : plan.featureLimits.maxAccounts}</div>
                                            <div>Expenses: {plan.featureLimits.maxExpenses === -1 ? 'Unlimited' : plan.featureLimits.maxExpenses}</div>
                                            <div>Incomes: {plan.featureLimits.maxIncomes === -1 ? 'Unlimited' : plan.featureLimits.maxIncomes}</div>
                                        </div>
                                    </div>

                                    <button
                                        disabled={isCurrentPlan}
                                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                            isCurrentPlan
                                                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                                : isHighlighted
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingSettings;
