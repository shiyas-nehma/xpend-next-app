'use client';

import React, { useState } from 'react';

const SubscriptionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plans');

  // Mock data for subscription plans
  const subscriptionPlans = [
    {
      id: 1,
      name: 'Basic Plan',
      price: '$9.99',
      duration: 'month',
      features: ['Up to 5 accounts', 'Basic expense tracking', 'Monthly reports', 'Email support'],
      active: true,
      subscribers: 1245
    },
    {
      id: 2,
      name: 'Pro Plan',
      price: '$19.99',
      duration: 'month',
      features: ['Unlimited accounts', 'Advanced analytics', 'Weekly reports', 'Priority support', 'Budget goals'],
      active: true,
      subscribers: 856
    },
    {
      id: 3,
      name: 'Enterprise Plan',
      price: '$49.99',
      duration: 'month',
      features: ['Everything in Pro', 'Team collaboration', 'API access', 'Custom integrations', '24/7 phone support'],
      active: false,
      subscribers: 0
    }
  ];

  const revenueStats = [
    { label: 'Monthly Revenue', value: '$42,567', change: '+12.5%', positive: true },
    { label: 'Annual Revenue', value: '$480,234', change: '+18.2%', positive: true },
    { label: 'Active Subscriptions', value: '2,101', change: '+8.7%', positive: true },
    { label: 'Churn Rate', value: '2.3%', change: '-0.5%', positive: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage subscription plans and pricing</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          Create New Plan
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'plans', label: 'Subscription Plans' },
            { id: 'revenue', label: 'Revenue Analytics' },
            { id: 'settings', label: 'Billing Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptionPlans.map(plan => (
              <div key={plan.id} className="bg-white border border-gray-200 rounded-xl p-6 relative">
                {plan.active && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">/{plan.duration}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="text-sm text-gray-500 mb-4">
                  {plan.subscribers} subscribers
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                    Edit Plan
                  </button>
                  <button className={`flex-1 py-2 px-4 rounded-lg text-sm transition-colors ${
                    plan.active 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}>
                    {plan.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {revenueStats.map((stat, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                    <p className="text-gray-900 text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`text-sm font-semibold ${
                    stat.positive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Revenue Chart - Integration with chart library needed</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Gateway
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>Stripe</option>
                  <option>PayPal</option>
                  <option>Square</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  defaultValue="8.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                </select>
              </div>

              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;