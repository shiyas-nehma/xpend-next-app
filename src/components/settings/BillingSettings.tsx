'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import SettingsCard from './SettingsCard';
import { CreditCardIcon, CalendarIcon, CheckCircleIcon, PlusIcon, ExclamationTriangleIcon } from '@/components/icons/NavIcons';
import { SubscriptionPlanService, Plan } from '@/lib/firebase/subscriptionService';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import { UserSubscription } from '@/types/subscription';
import SubscriptionUtils from '@/utils/subscriptionUtils';
import getStripe from '@/lib/stripe/stripe-client';

const BillingSettings: React.FC = () => {
    const { user } = useAuth();
    const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Load available subscription plans
        const unsubscribe = SubscriptionPlanService.onPlansChange((plans) => {
            console.log('Plans loaded:', plans);
            const activePlans = plans.filter(plan => plan.status === 'active');
            console.log('Active plans:', activePlans);
            setAvailablePlans(activePlans);
            setLoading(false);
        });

        // Initial load: Get user's latest subscription
        const loadLatestSubscription = async () => {
            try {
                const latestSubscription = await FirebaseUserSubscriptionService.getUserSubscription(user.uid);
                console.log('Loaded latest subscription:', latestSubscription ? {
                    id: latestSubscription.id,
                    planName: latestSubscription.planName,
                    createdAt: latestSubscription.createdAt,
                    status: latestSubscription.status
                } : 'None');
                setUserSubscription(latestSubscription);
            } catch (error) {
                console.error('Error loading latest subscription:', error);
            }
        };
        
        loadLatestSubscription();

        // Set up real-time listener for updates (will now return latest subscription)
        const unsubscribeSubscription = FirebaseUserSubscriptionService.onSubscriptionChange(
            user.uid,
            (subscription) => {
                console.log('Subscription updated via listener:', subscription ? {
                    id: subscription.id,
                    planName: subscription.planName,
                    createdAt: subscription.createdAt,
                    status: subscription.status
                } : 'None');
                setUserSubscription(subscription);
            }
        );

        return () => {
            unsubscribe();
            unsubscribeSubscription();
        };
    }, [user]);

    const handleSelectPlan = async (plan: Plan, billingCycle: 'monthly' | 'annual' = 'monthly') => {
        if (!user) return;
        
        console.log('=== Creating subscription ===');
        console.log('Plan:', plan);
        console.log('Billing cycle:', billingCycle);
        console.log('User ID:', user?.uid);
        
        try {
            setProcessingPayment(true);

            // Handle free plans (no Stripe integration needed)
            if (!SubscriptionUtils.requiresPayment(plan)) {
                console.log('Creating free plan subscription...');
                const response = await fetch('/api/subscriptions/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await user.getIdToken()}`,
                    },
                    body: JSON.stringify({
                        userId: user.uid,
                        planId: plan.id,
                        billingCycle,
                        userDetails: {
                            email: user.email,
                            firstName: user.displayName?.split(' ')[0],
                            lastName: user.displayName?.split(' ').slice(1).join(' '),
                        },
                    }),
                });

                console.log('Free plan API response status:', response.status);
                console.log('Free plan API response headers:', response.headers.get('content-type'));

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Free plan API error response:', errorText);
                    throw new Error(`API request failed: ${response.status} - ${errorText}`);
                }

                let result;
                try {
                    result = await response.json();
                } catch (jsonError) {
                    const responseText = await response.text();
                    console.error('Failed to parse JSON response:', responseText);
                    throw new Error(`Invalid JSON response: ${responseText}`);
                }

                console.log('Free plan API parsed result:', result);

                if (result.success) {
                    setShowPlanModal(false);
                    // Subscription will be updated via real-time listener
                } else {
                    throw new Error(result.error || 'Failed to create subscription');
                }
                return;
            }

            // Handle paid plans with Stripe
            const stripe = await getStripe();
            if (!stripe) {
                throw new Error('Stripe failed to load');
            }

            // Create subscription via API
            const response = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`,
                },
                body: JSON.stringify({
                    userId: user.uid,
                    planId: plan.id,
                    billingCycle,
                    userDetails: {
                        email: user.email,
                        firstName: user.displayName?.split(' ')[0],
                        lastName: user.displayName?.split(' ').slice(1).join(' '),
                    },
                }),
            });

            console.log('=== Raw Response Details ===');
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            console.log('Response status text:', response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            let result;
            try {
                const responseText = await response.text();
                console.log('Raw response text:', responseText);
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
            
            console.log('=== API Response Details ===');
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            console.log('Result object:', result);
            console.log('Result success:', result.success);
            console.log('Result error:', result.error);
            console.log('Result type:', typeof result);
            console.log('Result keys:', Object.keys(result));

            if (!response.ok || !result.success) {
                const errorDetails = {
                    status: response.status,
                    statusText: response.statusText,
                    responseOk: response.ok,
                    resultSuccess: result.success,
                    error: result.error,
                    details: result.details,
                    fullResult: result
                };
                console.error('Subscription creation failed:', errorDetails);
                
                const errorMessage = result.error 
                    || result.details 
                    || `API returned ${response.status} ${response.statusText}`;
                    
                throw new Error(errorMessage);
            }

            // Handle Stripe Checkout Session (for paid plans)
            if (result.checkout && result.url) {
                console.log('Redirecting to Stripe Checkout:', result.url);
                window.location.href = result.url;
                return;
            }

            // If subscription has trial period, no payment needed immediately
            if (plan.trialDays > 0) {
                setShowPlanModal(false);
                return;
            }

            // For direct subscriptions (legacy flow)
            if (result.clientSecret) {
                // Handle payment confirmation if needed
                // For now, we'll close the modal and let webhook handle the rest
                setShowPlanModal(false);
            }

        } catch (error) {
            console.error('Error creating subscription:', error);
            
            // Enhanced error logging for debugging
            if (error instanceof Error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                alert(`Failed to create subscription: ${error.message}`);
            } else {
                console.error('Unknown error type:', typeof error, error);
                alert('Failed to create subscription. Please check the console for details.');
            }
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!userSubscription || !user) return;

        if (!confirm('Are you sure you want to cancel your subscription?')) return;

        try {
            const response = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`,
                },
                body: JSON.stringify({
                    subscriptionId: userSubscription.id,
                    reason: 'User requested cancellation',
                }),
            });

            console.log('Cancel subscription API response status:', response.status);
            console.log('Cancel subscription API response headers:', response.headers.get('content-type'));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Cancel subscription API error response:', errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                const responseText = await response.text();
                console.error('Failed to parse JSON response:', responseText);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            console.log('Cancel subscription API parsed result:', result);

            if (!result.success) {
                throw new Error(result.error || 'Failed to cancel subscription');
            }

            // Subscription will be updated via real-time listener
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert('Failed to cancel subscription. Please try again.');
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

    const isActive = SubscriptionUtils.isActive(userSubscription);
    const isInTrial = SubscriptionUtils.isInTrial(userSubscription);
    const trialDaysRemaining = SubscriptionUtils.getTrialDaysRemaining(userSubscription);
    const statusText = SubscriptionUtils.getStatusDisplayText(userSubscription);
    const statusColor = SubscriptionUtils.getStatusColor(userSubscription);
    const isCancelledButActive = SubscriptionUtils.isCancelledButActive(userSubscription);

    return (
        <>
            <SettingsCard 
                title="Billing & Plans"
                footer={
                    <>
                        {userSubscription ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowPlanModal(true)}
                                    className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors"
                                >
                                    Change Plan
                                </button>
                                {isActive && !isCancelledButActive && (
                                    <button 
                                        onClick={handleCancelSubscription}
                                        className="bg-red-100 border border-red-300 text-red-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
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
                    // User has subscription - show current plan and status
                    <>
                        <div className="bg-brand-surface-2 border border-brand-border rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-brand-text-secondary">Current Plan</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700`}>
                                    {statusText}
                                </span>
                            </div>
                            <p className="text-lg font-semibold text-brand-text-primary">{userSubscription.planName}</p>
                            
                            {/* Debug: Show subscription details */}
                            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-xs text-gray-600">
                                    <strong>Subscription ID:</strong> {userSubscription.id}
                                </p>
                                <p className="text-xs text-gray-600">
                                    <strong>Created:</strong> {userSubscription.createdAt.toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        timeZoneName: 'short'
                                    })}
                                </p>
                                <p className="text-xs text-gray-600">
                                    <strong>Status:</strong> {userSubscription.status}
                                </p>
                            </div>
                            
                            {/* Trial Information */}
                            {isInTrial && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-blue-700">
                                            Trial ends in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Billing Information */}
                            <p className="text-sm text-brand-text-secondary mt-2">
                                {isCancelledButActive ? (
                                    <>Subscription ends on <span className="text-brand-text-primary font-medium">
                                        {userSubscription.endDate.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </span></>
                                ) : (
                                    <>Next billing: <span className="text-brand-text-primary font-medium">
                                        {SubscriptionUtils.getNextBillingDateDisplay(userSubscription)}
                                    </span></>
                                )}
                            </p>
                            
                            {/* Price Information */}
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-lg font-bold text-brand-text-primary">
                                    {SubscriptionUtils.formatCurrency(userSubscription.monthlyPrice)}
                                </span>
                                <span className="text-sm text-brand-text-secondary">
                                    / {userSubscription.billingCycle === 'annual' ? 'year' : 'month'}
                                </span>
                            </div>
                        </div>
                        
                        {userSubscription.paymentMethod && (
                            <div>
                                <h4 className="font-medium text-brand-text-primary mb-2">Payment Method</h4>
                                <div className="flex items-center justify-between bg-brand-surface-2 border border-brand-border rounded-xl p-4">
                                    <div className="flex items-center space-x-3">
                                        <CreditCardIcon className="w-8 h-8 text-brand-text-secondary" />
                                        <div>
                                            <p className="font-medium text-brand-text-primary">
                                                {userSubscription.paymentMethod.brand.charAt(0).toUpperCase() + userSubscription.paymentMethod.brand.slice(1)} ending in {userSubscription.paymentMethod.last4}
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
                    processing={processingPayment}
                />
            )}
        </>
    );
};

// Plan Selection Modal Component
interface PlanSelectionModalProps {
    plans: Plan[];
    currentPlan?: string;
    onSelectPlan: (plan: Plan, billingCycle: 'monthly' | 'annual') => void;
    onClose: () => void;
    processing: boolean;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ 
    plans, 
    currentPlan, 
    onSelectPlan, 
    onClose,
    processing
}) => {
    const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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
                            disabled={processing}
                            className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-gray-600 mt-2">Select the perfect plan for your expense management needs</p>
                    
                    {/* Billing Cycle Toggle */}
                    <div className="mt-4 flex items-center justify-center">
                        <div className="bg-gray-100 rounded-lg p-1 flex">
                            <button
                                onClick={() => setSelectedBillingCycle('monthly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    selectedBillingCycle === 'monthly'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setSelectedBillingCycle('annual')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    selectedBillingCycle === 'annual'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Annual
                                <span className="ml-1 text-green-600 text-xs">Save up to 20%</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrentPlan = currentPlan === plan.id;
                            const isHighlighted = plan.highlight;
                            const isFree = !SubscriptionUtils.requiresPayment(plan);
                            
                            const displayPrice = selectedBillingCycle === 'monthly' 
                                ? plan.monthlyPrice
                                : plan.annualDiscountPct 
                                    ? calculateAnnualPrice(plan.monthlyPrice, plan.annualDiscountPct) / 12
                                    : plan.monthlyPrice;

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
                                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => !isCurrentPlan && !processing && onSelectPlan(plan, selectedBillingCycle)}
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

                                    {isFree && (
                                        <div className="absolute -top-3 left-4">
                                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                Free
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <div className="mb-2">
                                            <span className="text-3xl font-bold text-gray-900">
                                                {isFree ? 'Free' : SubscriptionUtils.formatCurrency(displayPrice)}
                                            </span>
                                            {!isFree && (
                                                <span className="text-gray-600">
                                                    /{selectedBillingCycle === 'monthly' ? 'month' : 'month'}
                                                </span>
                                            )}
                                        </div>
                                        {!isFree && selectedBillingCycle === 'annual' && plan.annualDiscountPct && plan.annualDiscountPct > 0 && (
                                            <div className="text-sm text-green-600">
                                                {SubscriptionUtils.formatCurrency(annualPrice)}/year 
                                                <span className="ml-1">({plan.annualDiscountPct}% off annually)</span>
                                            </div>
                                        )}
                                        {plan.trialDays > 0 && !isFree && (
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
                                        disabled={isCurrentPlan || processing}
                                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                            isCurrentPlan
                                                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                                : processing
                                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                : isHighlighted
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        {processing 
                                            ? 'Processing...'
                                            : isCurrentPlan 
                                                ? 'Current Plan' 
                                                : isFree 
                                                    ? 'Get Started Free'
                                                    : plan.trialDays > 0
                                                        ? `Start Free Trial`
                                                        : 'Select Plan'
                                        }
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
