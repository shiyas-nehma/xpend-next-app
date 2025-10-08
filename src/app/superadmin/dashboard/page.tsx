'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSuperAdmin } from '@/lib/firebase/auth';

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
        <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-gray-900 text-2xl font-bold mt-1">{stat.value}</p>
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
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">User Management</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 font-medium text-gray-500">Name</th>
              <th className="text-left py-2 px-4 font-medium text-gray-500">Email</th>
              <th className="text-left py-2 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-2 px-4 font-medium text-gray-500">Joined</th>
              <th className="text-left py-2 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{user.name}</td>
                <td className="py-3 px-4 text-gray-600">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{user.joined}</td>
                <td className="py-3 px-4">
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    Edit
                  </button>
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
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">System Logs</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-3 text-sm">
            <span className="text-gray-500 font-mono min-w-max">{log.time}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium min-w-max ${
              log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
              log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {log.level}
            </span>
            <span className="text-gray-700">{log.message}</span>
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

  useEffect(() => {
    // Check admin authentication
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem('superadmin_token');
        const adminDataStr = localStorage.getItem('superadmin_data');
        
        if (!token || !adminDataStr) {
          console.log('No token or admin data found in local storage');
          router.push('/superadmin/login');
          return;
        }
        
        // Parse stored admin data
        const storedAdminData = JSON.parse(adminDataStr);
        setAdminData(storedAdminData);
        
        // Verify with Firebase that user is still superadmin (non-blocking)
        // This runs in background to ensure the token is still valid
        isSuperAdmin().then(isAdmin => {
          if (!isAdmin) {
            console.log('User is no longer a superadmin');
            localStorage.removeItem('superadmin_token');
            localStorage.removeItem('superadmin_data');
            router.push('/superadmin/login');
          }
        }).catch(error => {
          console.error('Error verifying superadmin status:', error);
          // Don't redirect immediately on error, Firebase might be initializing
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_data');
        router.push('/superadmin/login');
      }
    };
    
    checkAdminAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {adminData?.displayName || 'Super Administrator'}</p>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
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
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-4 rounded-lg text-sm font-medium transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}