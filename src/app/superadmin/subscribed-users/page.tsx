"use client";
import React, { useState } from 'react';
import SurfaceCard from '@/components/superadmin/common/SurfaceCard';

const SubscribedUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Mock data for subscribed users
  const subscribedUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      plan: 'Pro Plan',
      status: 'Active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      revenue: '$239.88',
      avatar: 'JD'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      plan: 'Basic Plan',
      status: 'Active',
      startDate: '2024-02-20',
      endDate: '2025-02-20',
      revenue: '$119.88',
      avatar: 'JS'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      plan: 'Pro Plan',
      status: 'Expired',
      startDate: '2023-12-01',
      endDate: '2024-12-01',
      revenue: '$239.88',
      avatar: 'BJ'
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      plan: 'Enterprise Plan',
      status: 'Active',
      startDate: '2024-03-10',
      endDate: '2025-03-10',
      revenue: '$599.88',
      avatar: 'AB'
    },
    {
      id: 5,
      name: 'Charlie Wilson',
      email: 'charlie.wilson@example.com',
      plan: 'Basic Plan',
      status: 'Cancelled',
      startDate: '2024-01-05',
      endDate: '2024-07-05',
      revenue: '$59.94',
      avatar: 'CW'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/15 text-green-300 border border-green-500/30';
      case 'Expired':
        return 'bg-red-500/15 text-red-300 border border-red-500/30';
      case 'Cancelled':
        return 'bg-gray-500/15 text-gray-300 border border-gray-500/30';
      default:
        return 'bg-gray-500/15 text-gray-300 border border-gray-500/30';
    }
  };

  const filteredUsers = subscribedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscribed Users</h1>
          <p className="text-brand-text-secondary text-sm mt-1">Manage and monitor user subscriptions</p>
        </div>
        <button className="h-10 px-4 rounded-lg bg-brand-blue text-white text-sm font-medium hover:brightness-110 transition">Export Users</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[{ label: 'Total Users', value: '2,101' }, { label: 'Active', value: '1,876' }, { label: 'Expired', value: '156' }, { label: 'MRR', value: '$42.5K' }].map(c => (
          <SurfaceCard key={c.label} className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-brand-text-secondary font-medium">{c.label}</p>
            <p className="mt-2 text-xl font-semibold">{c.value}</p>
          </SurfaceCard>
        ))}
      </div>
      <SurfaceCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-4 py-2 text-sm placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="Basic Plan">Basic Plan</option>
              <option value="Pro Plan">Pro Plan</option>
              <option value="Enterprise Plan">Enterprise Plan</option>
            </select>
          </div>
        </div>
      </SurfaceCard>
      <SurfaceCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border/60 text-[11px] uppercase tracking-wide text-brand-text-secondary">
                <th className="text-left py-3 px-5 font-medium">User</th>
                <th className="text-left py-3 px-5 font-medium">Plan</th>
                <th className="text-left py-3 px-5 font-medium">Status</th>
                <th className="text-left py-3 px-5 font-medium">Period</th>
                <th className="text-left py-3 px-5 font-medium">Revenue</th>
                <th className="text-left py-3 px-5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map(user => (
                <tr key={user.id} className="border-b border-brand-border/40 last:border-0 hover:bg-brand-surface-2">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-blue/20 text-brand-blue rounded-full flex items-center justify-center text-xs font-semibold">{user.avatar}</div>
                      <div>
                        <div className="text-white font-medium leading-tight">{user.name}</div>
                        <div className="text-brand-text-secondary text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-brand-text-secondary">{user.plan}</td>
                  <td className="py-3 px-5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(user.status)}`}>{user.status}</span></td>
                  <td className="py-3 px-5 text-brand-text-secondary"><div>{user.startDate}</div><div className="text-brand-text-secondary/70">to {user.endDate}</div></td>
                  <td className="py-3 px-5 font-medium text-white">{user.revenue}</td>
                  <td className="py-3 px-5">
                    <div className="flex gap-3 text-xs">
                      <button className="text-brand-blue hover:underline">View</button>
                      <button className="text-green-400 hover:underline">Extend</button>
                      <button className="text-red-400 hover:underline">Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-brand-border/60 bg-brand-surface">
            <div className="hidden sm:block">
              <p className="text-xs text-brand-text-secondary">Showing <span className="text-brand-text-primary">{startIndex + 1}</span> to <span className="text-brand-text-primary">{Math.min(endIndex, filteredUsers.length)}</span> of <span className="text-brand-text-primary">{filteredUsers.length}</span> results</p>
            </div>
            <div className="ml-auto flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`h-8 w-8 rounded-md text-xs font-medium border transition-colors ${page === currentPage ? 'bg-brand-blue text-white border-brand-blue' : 'bg-brand-surface-2 border-brand-border text-brand-text-secondary hover:bg-brand-surface'}`}>{page}</button>
              ))}
            </div>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
};

export default SubscribedUsersPage;