"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { useCurrency } from '@/context/CurrencyContext';

// Types
interface Plan {
  id: string;
  name: string;
  monthlyPrice: number; // base monthly
  annualDiscountPct?: number; // optional discount for annual
  features: string[];
  status: 'active' | 'draft' | 'deprecated';
  subscribers: number; // active subscribers on this plan
  trialDays: number;
  highlight?: boolean; // UI highlight
  sortOrder: number;
}

interface EditState {
  open: boolean;
  plan: Plan | null;
}

// Reusable card base with brand styling
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={`bg-brand-surface rounded-2xl p-5 relative overflow-hidden border border-brand-border 
    before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-2xl before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_60%)] ${className || ''}`}>
    <div className="relative z-10">{children}</div>
  </div>
);

// Toggle pill component
const Segmented: React.FC<{ options: string[]; value: string; onChange: (v: string) => void; className?: string }> = ({ options, value, onChange, className }) => (
  <div className={`flex p-1 rounded-xl bg-brand-surface-2 border border-brand-border relative ${className || ''}`}> 
    {options.map(opt => {
      const active = opt === value;
      return (
        <button key={opt} onClick={() => onChange(opt)} className={`relative flex-1 text-xs md:text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${active ? 'text-white' : 'text-brand-text-secondary hover:text-white'}`}> 
          {active && (
            <motion.span layoutId="seg-pill" className="absolute inset-0 bg-brand-surface rounded-lg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
          )}
          <span className="relative z-10">{opt}</span>
        </button>
      );
    })}
  </div>
);

// Simple modal for plan create/edit
const PlanModal: React.FC<{ state: EditState; onClose: () => void; onSave: (plan: Partial<Plan>) => void; } > = ({ state, onClose, onSave }) => {
  const editing = !!state.plan;
  const [form, setForm] = useState<Partial<Plan>>(() => state.plan ? { ...state.plan } : { name: '', monthlyPrice: 0, annualDiscountPct: 20, features: [''], status: 'draft', subscribers: 0, trialDays: 14, sortOrder: 0 });

  const update = (key: keyof Plan, value: any) => setForm(f => ({ ...f, [key]: value }));

  const updateFeature = (i: number, val: string) => {
    setForm(f => ({ ...f, features: (f.features || []).map((ft, idx) => idx === i ? val : ft) }));
  };
  const addFeature = () => setForm(f => ({ ...f, features: [...(f.features || []), ''] }));
  const removeFeature = (i: number) => setForm(f => ({ ...f, features: (f.features || []).filter((_, idx) => idx !== i) }));

  const save = () => {
    if (!form.name) return;
    onSave(form);
    onClose();
  };

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 210, damping: 24 }} className="relative w-full max-w-2xl bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{editing ? 'Edit Plan' : 'Create Plan'}</h3>
                <p className="text-sm text-brand-text-secondary">Configure pricing & features</p>
              </div>
              <button onClick={onClose} className="text-brand-text-secondary hover:text-white text-sm">✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-brand-text-secondary block mb-1">Name</label>
                  <input value={form.name || ''} onChange={e => update('name', e.target.value)} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-brand-text-secondary block mb-1">Monthly Price</label>
                    <input type="number" value={form.monthlyPrice ?? 0} onChange={e => update('monthlyPrice', parseFloat(e.target.value))} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-brand-text-secondary block mb-1">Annual Discount %</label>
                    <input type="number" value={form.annualDiscountPct ?? 0} onChange={e => update('annualDiscountPct', parseFloat(e.target.value))} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-brand-text-secondary block mb-1">Trial Days</label>
                    <input type="number" value={form.trialDays ?? 0} onChange={e => update('trialDays', parseInt(e.target.value))} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-brand-text-secondary block mb-1">Sort Order</label>
                    <input type="number" value={form.sortOrder ?? 0} onChange={e => update('sortOrder', parseInt(e.target.value))} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-text-secondary block mb-1">Status</label>
                  <select value={form.status} onChange={e => update('status', e.target.value as any)} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-brand-text-secondary select-none">
                  <input type="checkbox" checked={!!form.highlight} onChange={e => update('highlight', e.target.checked)} className="rounded border-brand-border bg-brand-surface-2" /> Highlight Card
                </label>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-brand-text-secondary block">Features</label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scroll">
                  {(form.features || []).map((ft, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={ft} onChange={e => updateFeature(i, e.target.value)} placeholder={`Feature ${i+1}`} className="flex-1 bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-1.5 text-sm" />
                      <button onClick={() => removeFeature(i)} className="text-brand-text-secondary hover:text-red-400 text-xs px-2">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={addFeature} className="text-xs bg-brand-surface-2 hover:bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 transition-colors">+ Add Feature</button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg bg-brand-surface-2 border border-brand-border hover:bg-brand-surface transition-colors">Cancel</button>
              <button onClick={save} className="text-sm px-4 py-2 rounded-lg bg-brand-blue text-white hover:brightness-110 transition-colors">{editing ? 'Save Changes' : 'Create Plan'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Revenue mock data
const revenueHistory = Array.from({ length: 8 }).map((_, i) => ({
  month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
  mrr: 12000 + i * 1800 + (i % 2 === 0 ? 900 : 0),
  churn: 2 + (i % 3) * 0.4,
  newSubs: 200 + i * 20
}));

const cohortData = Array.from({ length: 6 }).map((_, i) => ({
  cohort: `2024-${i+1}`,
  retention: 92 - i * 4
}));

const SubscriptionPage: React.FC = () => {
  const { format, code, symbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<'plans' | 'analytics' | 'settings'>('plans');
  const [billingPeriod, setBillingPeriod] = useState<'Monthly' | 'Annual'>('Monthly');
  const [editState, setEditState] = useState<EditState>({ open: false, plan: null });

  const [plans, setPlans] = useState<Plan[]>([
    { id: 'basic', name: 'Basic', monthlyPrice: 9.99, annualDiscountPct: 20, features: ['Up to 5 accounts', 'Core tracking', 'Monthly reports', 'Email support'], status: 'active', subscribers: 1245, trialDays: 7, sortOrder: 1 },
    { id: 'pro', name: 'Pro', monthlyPrice: 19.99, annualDiscountPct: 25, features: ['Unlimited accounts', 'Advanced analytics', 'Weekly reports', 'Priority support', 'Budget goals'], status: 'active', subscribers: 856, trialDays: 14, sortOrder: 2, highlight: true },
    { id: 'enterprise', name: 'Enterprise', monthlyPrice: 59.0, annualDiscountPct: 30, features: ['All Pro features', 'Team workspaces', 'API access', 'Custom integrations', '24/7 phone support'], status: 'draft', subscribers: 34, trialDays: 21, sortOrder: 3 }
  ]);

  // Derived KPI metrics
  const metrics = useMemo(() => {
    const activePlans = plans.filter(p => p.status === 'active');
    const totalSubs = activePlans.reduce((s, p) => s + p.subscribers, 0);
    const mrr = activePlans.reduce((s, p) => s + p.monthlyPrice * p.subscribers, 0);
    const arpu = totalSubs ? mrr / totalSubs : 0;
    return { totalSubs, mrr, arpu, churnRate: 2.3 }; // churn placeholder
  }, [plans]);

  const displayPrice = (plan: Plan) => {
    if (billingPeriod === 'Monthly') return format(plan.monthlyPrice, { currency: code });
    const annual = plan.monthlyPrice * 12 * (1 - (plan.annualDiscountPct || 0) / 100);
    return format(annual, { currency: code });
  };

  const handleSavePlan = (partial: Partial<Plan>) => {
    if (partial.id) {
      setPlans(prev => prev.map(p => p.id === partial.id ? { ...p, ...partial } as Plan : p));
    } else {
      const id = partial.name?.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      setPlans(prev => [...prev, { id, name: partial.name || 'New Plan', monthlyPrice: partial.monthlyPrice || 0, annualDiscountPct: partial.annualDiscountPct || 0, features: partial.features || [], status: (partial.status as any) || 'draft', subscribers: partial.subscribers || 0, trialDays: partial.trialDays || 0, highlight: partial.highlight, sortOrder: partial.sortOrder || prev.length + 1 }]);
    }
  };

  const toggleStatus = (plan: Plan) => {
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: p.status === 'active' ? 'deprecated' : 'active' } : p));
  };

  const deletePlan = (plan: Plan) => {
    if (confirm(`Delete plan ${plan.name}?`)) {
      setPlans(prev => prev.filter(p => p.id !== plan.id));
    }
  };

  const orderedPlans = useMemo(() => plans.slice().sort((a,b) => a.sortOrder - b.sortOrder), [plans]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Subscription Management</h1>
          <p className="text-sm text-brand-text-secondary mt-1">Configure pricing tiers, analyze revenue & manage billing settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Segmented options={['Monthly','Annual']} value={billingPeriod} onChange={v => setBillingPeriod(v as any)} />
          <button onClick={() => setEditState({ open: true, plan: null })} className="bg-brand-blue hover:brightness-110 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">New Plan</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'plans', label: 'Plans' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'settings', label: 'Billing Settings' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-brand-surface-2 border border-brand-border text-white' : 'text-brand-text-secondary hover:text-white hover:bg-brand-surface-2/60'}`}>{tab.label}</button>
        ))}
      </div>

      {/* Plans Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .25 }} className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <p className="text-xs text-brand-text-secondary">MRR</p>
                <p className="text-xl font-semibold mt-1">{format(metrics.mrr)}</p>
                <span className="text-xs text-green-400 font-medium">+12.5% MoM</span>
              </Card>
              <Card>
                <p className="text-xs text-brand-text-secondary">Active Subscribers</p>
                <p className="text-xl font-semibold mt-1">{metrics.totalSubs.toLocaleString()}</p>
                <span className="text-xs text-green-400 font-medium">+8.7%</span>
              </Card>
              <Card>
                <p className="text-xs text-brand-text-secondary">ARPU</p>
                <p className="text-xl font-semibold mt-1">{format(metrics.arpu)}</p>
                <span className="text-xs text-brand-text-secondary">per active sub</span>
              </Card>
              <Card>
                <p className="text-xs text-brand-text-secondary">Churn Rate</p>
                <p className="text-xl font-semibold mt-1">{metrics.churnRate.toFixed(1)}%</p>
                <span className="text-xs text-green-400 font-medium">-0.5%</span>
              </Card>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orderedPlans.map(plan => {
                const price = displayPrice(plan);
                const isAnnual = billingPeriod === 'Annual';
                const monthlyEquivalent = isAnnual ? plan.monthlyPrice * (1 - (plan.annualDiscountPct||0)/100) : plan.monthlyPrice;
                return (
                  <motion.div key={plan.id} layout className={`relative rounded-2xl border ${plan.highlight ? 'border-brand-blue/60 shadow-[0_0_0_1px_rgba(93,120,255,0.4),0_4px_30px_-10px_rgba(93,120,255,0.4)]' : 'border-brand-border'} bg-brand-surface p-5 flex flex-col overflow-hidden group`}> 
                    {plan.highlight && <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(93,120,255,0.25),transparent_60%)]"/>}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">{plan.name}{plan.status !== 'active' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 capitalize">{plan.status}</span>}</h3>
                        <div className="mt-1 flex items-end gap-1">
                          <span className="text-3xl font-bold tracking-tight">{price}</span>
                          <span className="text-xs text-brand-text-secondary mb-1">/{isAnnual ? 'year' : 'mo'}</span>
                        </div>
                        {isAnnual && plan.annualDiscountPct && <p className="text-[10px] uppercase tracking-wide text-green-400 font-medium mt-1">Save {plan.annualDiscountPct}% • {format(monthlyEquivalent)}/mo equiv</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-brand-text-secondary">Subscribers</p>
                        <p className="text-sm font-medium">{plan.subscribers.toLocaleString()}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-5 flex-1">
                      {plan.features.slice(0,8).map((ft,i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-brand-text-secondary">
                          <span className="w-4 h-4 mt-0.5 flex items-center justify-center rounded-md bg-brand-surface-2 text-[10px] text-green-400">✓</span>
                          <span>{ft}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditState({ open: true, plan })} className="text-xs px-3 py-1.5 rounded-lg bg-brand-surface-2 hover:bg-brand-surface border border-brand-border">Edit</button>
                      <button onClick={() => toggleStatus(plan)} className="text-xs px-3 py-1.5 rounded-lg bg-brand-surface-2 hover:bg-brand-surface border border-brand-border">{plan.status === 'active' ? 'Deprecate' : 'Activate'}</button>
                      <button onClick={() => setPlans(prev => [...prev, { ...plan, id: plan.id + '-copy', name: plan.name + ' Copy', sortOrder: prev.length + 1, status: 'draft' }])} className="text-xs px-3 py-1.5 rounded-lg bg-brand-surface-2 hover:bg-brand-surface border border-brand-border">Duplicate</button>
                      <button onClick={() => deletePlan(plan)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30">Delete</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-[11px] text-brand-text-secondary">Note: All values are mock placeholders. Integrate with Firestore Stripe webhooks for real metrics.</p>
          </motion.div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .25 }} className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">MRR Trend</h3>
                  <span className="text-xs text-brand-text-secondary">Last {revenueHistory.length} months</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mrrLine" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5D78FF" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#5D78FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8A8A8A', fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => symbol + (v/1000).toFixed(0) + 'k'} tickLine={false} axisLine={false} tick={{ fill: '#8A8A8A', fontSize: 12 }} />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item: any = payload[0];
                          return <div className="bg-black/70 border border-brand-border rounded-md px-3 py-2 text-xs"><p className="font-medium">{item.payload.month}</p><p>MRR: {format(item.payload.mrr)}</p><p>New Subs: {item.payload.newSubs}</p></div>;
                        }
                        return null;
                      }} cursor={{ stroke: '#444', strokeDasharray: '3 3' }} />
                      <Line type="monotone" dataKey="mrr" stroke="#5D78FF" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                <h3 className="font-semibold mb-4">New vs Churned</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8A8A8A', fontSize: 12 }} />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload) {
                          return <div className="bg-black/70 border border-brand-border rounded-md px-3 py-2 text-xs space-y-1">{payload.map((p: any) => <p key={p.dataKey}><span className="capitalize">{p.dataKey}</span>: {p.value}</p>)}</div>;
                        }
                        return null;
                      }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="newSubs" fill="#5D78FF" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <h3 className="font-semibold mb-3">Cohort Retention (Placeholder)</h3>
                <div className="grid grid-cols-7 text-[10px] uppercase tracking-wide text-brand-text-secondary mb-2">
                  <span>Cohort</span>
                  {[1,2,3,4,5,6].map(m => <span key={m}>M{m}</span>)}
                </div>
                <div className="space-y-1">
                  {cohortData.map(row => (
                    <div key={row.cohort} className="grid grid-cols-7 gap-1 text-xs items-center">
                      <span className="text-brand-text-secondary">{row.cohort}</span>
                      {[1,2,3,4,5,6].map(m => {
                        const val = Math.max(0, row.retention - (m-1)*5);
                        const hue = 140; // greenish
                        const alpha = val/100;
                        return <span key={m} className="h-6 rounded flex items-center justify-center font-medium" style={{ background: `hsla(${hue},60%,40%,${alpha})`, color: val > 50 ? 'white' : '#ccc' }}>{val}%</span>;
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-brand-text-secondary mt-3">Integrate with subscription_events to produce true cohort retention.</p>
              </Card>
              <Card>
                <h3 className="font-semibold mb-4">Breakdown</h3>
                <ul className="space-y-2 text-sm">
                  {orderedPlans.map(p => {
                    const share = metrics.mrr ? (p.monthlyPrice * p.subscribers)/metrics.mrr*100 : 0;
                    return (
                      <li key={p.id} className="space-y-1">
                        <div className="flex justify-between"><span className="text-brand-text-secondary">{p.name}</span><span>{share.toFixed(1)}%</span></div>
                        <div className="h-1.5 rounded bg-brand-surface-2 overflow-hidden"><div className="h-full bg-brand-blue" style={{ width: share + '%' }} /></div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .25 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-semibold mb-4">Payment Providers</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Stripe</p>
                      <p className="text-xs text-brand-text-secondary">Primary gateway • Webhooks configured</p>
                    </div>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-surface-2 border border-brand-border hover:bg-brand-surface">Manage</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">PayPal</p>
                      <p className="text-xs text-brand-text-secondary">Inactive • Not connected</p>
                    </div>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-blue text-white hover:brightness-110">Connect</button>
                  </div>
                </div>
              </Card>
              <Card>
                <h3 className="font-semibold mb-4">Tax & Invoicing</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-xs text-brand-text-secondary block mb-1">Default Tax Rate (%)</label>
                    <input defaultValue={8.5} type="number" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary block mb-1">Invoice Footer Note</label>
                    <textarea rows={3} defaultValue={'Thank you for choosing Xpend.'} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary text-xs">Collect VAT/GST</span>
                    <label className="inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><span className="w-10 h-5 rounded-full bg-brand-surface-2 peer-checked:bg-brand-blue relative after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"/></label>
                  </div>
                </div>
              </Card>
              <Card>
                <h3 className="font-semibold mb-4">Proration & Trials</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Automatic Proration</p>
                      <p className="text-xs text-brand-text-secondary">Adjust invoices when upgrading mid-cycle</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><span className="w-10 h-5 rounded-full bg-brand-surface-2 peer-checked:bg-brand-blue relative after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"/></label>
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary block mb-1">Default Trial Days</label>
                    <input type="number" defaultValue={14} className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Grace Period</p>
                      <p className="text-xs text-brand-text-secondary">Allow access while payment pending</p>
                    </div>
                    <select defaultValue={3} className="bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-1.5 text-xs">
                      {[0,1,3,5,7].map(d => <option key={d} value={d}>{d}d</option>)}
                    </select>
                  </div>
                </div>
              </Card>
              <Card>
                <h3 className="font-semibold mb-4">Promotions</h3>
                <div className="space-y-3 text-sm">
                  <div className="border border-dashed border-brand-border rounded-lg p-4 flex flex-col items-center justify-center text-brand-text-secondary text-xs">
                    <p>Create discount codes (Coming soon)</p>
                  </div>
                  <ul className="space-y-2 text-xs text-brand-text-secondary">
                    <li>• Time-bound trial extensions</li>
                    <li>• Percentage or flat discounts</li>
                    <li>• Usage limits & eligibility rules</li>
                  </ul>
                </div>
              </Card>
            </div>
            <p className="text-[11px] text-brand-text-secondary">Future: Wire these settings to Firestore collection (billing_settings) + secure server functions for provider secrets.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <PlanModal state={editState} onClose={() => setEditState({ open: false, plan: null })} onSave={handleSavePlan} />
    </div>
  );
};

export default SubscriptionPage;