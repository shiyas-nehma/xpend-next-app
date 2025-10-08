'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { logout, isSuperAdmin } from '@/lib/firebase/auth';

// Admin Dashboard Components
const DashboardStats: React.FC = () => {
  const stats = [
    { label: 'Total Users', value: '12,543', change: '+12%', color: 'text-green-400' },
    { label: 'Active Sessions', value: '8,234', change: '+5%', color: 'text-blue-400' },
    { label: 'Revenue (MTD)', value: '$45,678', change: '+18%', color: 'text-purple-400' },
    { label: 'System Health', value: '99.9%', change: '+0.1%', color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-text-secondary text-sm font-medium">{stat.label}</p>
              <p className="text-brand-text-primary text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`text-sm font-semibold ${stat.color}`}>
              {stat.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const UserManagement: React.FC = () => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', joined: '2024-02-20' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Suspended', joined: '2024-03-10' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Active', joined: '2024-04-05' },
  ];

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
      <h3 className="text-xl font-bold text-brand-text-primary mb-4">User Management</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="text-left py-3 px-4 text-brand-text-secondary font-medium">Name</th>
              <th className="text-left py-3 px-4 text-brand-text-secondary font-medium">Email</th>
              <th className="text-left py-3 px-4 text-brand-text-secondary font-medium">Status</th>
              <th className="text-left py-3 px-4 text-brand-text-secondary font-medium">Joined</th>
              <th className="text-left py-3 px-4 text-brand-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-brand-border last:border-b-0">
                <td className="py-3 px-4 text-brand-text-primary font-medium">{user.name}</td>
                <td className="py-3 px-4 text-brand-text-secondary">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'Active' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-brand-text-secondary">{user.joined}</td>
                <td className="py-3 px-4">
                  <button className="text-brand-blue hover:underline text-sm mr-3">View</button>
                  <button className="text-red-400 hover:underline text-sm">Suspend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SystemLogs: React.FC = () => {
  const logs = [
    { time: '2024-10-08 14:30:25', level: 'INFO', message: 'User login successful: john@example.com' },
    { time: '2024-10-08 14:28:15', level: 'WARN', message: 'Failed login attempt: unknown@test.com' },
    { time: '2024-10-08 14:25:10', level: 'INFO', message: 'Database backup completed successfully' },
    { time: '2024-10-08 14:20:05', level: 'ERROR', message: 'Payment processing timeout for transaction #12345' },
    { time: '2024-10-08 14:15:00', level: 'INFO', message: 'System maintenance completed' },
  ];

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
      <h3 className="text-xl font-bold text-brand-text-primary mb-4">System Logs</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-3 text-sm">
            <div className="text-brand-text-secondary font-mono">{log.time}</div>
            <div className={`font-semibold ${
              log.level === 'ERROR' ? 'text-red-400' : 
              log.level === 'WARN' ? 'text-yellow-400' : 
              'text-green-400'
            }`}>
              {log.level}
            </div>
            <div className="text-brand-text-primary flex-1">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    // Check admin authentication
    const checkAdminAuth = async () => {
      try {
        const token = sessionStorage.getItem('superadmin_token');
        const adminDataStr = sessionStorage.getItem('superadmin_data');
        
        if (!token) {
          router.push('/superadmin/login');
          return;
        }
        
        // Verify with Firebase that user is still superadmin
        const isAdmin = await isSuperAdmin();
        if (!isAdmin) {
          sessionStorage.removeItem('superadmin_token');
          sessionStorage.removeItem('superadmin_data');
          router.push('/superadmin/login');
          return;
        }
        
        if (adminDataStr) {
          setAdminData(JSON.parse(adminDataStr));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/superadmin/login');
      }
    };
    
    checkAdminAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      sessionStorage.removeItem('superadmin_token');
      sessionStorage.removeItem('superadmin_data');
      addToast('Logged out successfully', 'success');
      router.push('/superadmin/login');
    } catch (error) {
      console.error('Logout error:', error);
      addToast('Error during logout', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-brand-text-primary">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-brand-surface border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <div className="w-1 h-4 bg-white rounded-full transform -skew-x-12" />
                <div className="w-1 h-5 bg-white rounded-full transform -skew-x-12 ml-1" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-text-primary">Super Admin Dashboard</h1>
                <p className="text-sm text-brand-text-secondary">Administrative Control Panel</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-brand-text-primary">
                  {adminData?.displayName || 'Super Administrator'}
                </p>
                <p className="text-xs text-brand-text-secondary">
                  {adminData?.email || 'superadmin@superadmin.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <DashboardStats />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="lg:col-span-2">
            <UserManagement />
          </div>
          
          {/* System Logs */}
          <div className="lg:col-span-2">
            <SystemLogs />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-brand-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'Export Users',
              'System Backup',
              'Clear Cache',
              'Send Notifications',
              'Generate Reports',
              'Maintenance Mode'
            ].map((action, index) => (
              <button
                key={index}
                className="bg-brand-surface border border-brand-border hover:bg-brand-border text-brand-text-primary p-4 rounded-lg text-sm font-medium transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}