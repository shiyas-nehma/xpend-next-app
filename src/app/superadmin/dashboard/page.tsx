"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSuperAdmin } from '@/lib/firebase/auth';
import MetricCard from '@/components/superadmin/common/MetricCard';
import SurfaceCard from '@/components/superadmin/common/SurfaceCard';

// Admin Dashboard Components
const DashboardStats: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-8">
    <MetricCard label="Total Users" value="12,543" change="+12%" changeTone="up" />
    <MetricCard label="Active Sessions" value="8,234" change="+5%" changeTone="up" />
    <MetricCard label="Revenue (MTD)" value="$45,678" change="+18%" changeTone="up" />
    <MetricCard label="System Health" value="99.9%" change="+0.1%" changeTone="up" />
  </div>
);

const UserManagement: React.FC = () => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', joined: '2024-02-20' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Suspended', joined: '2024-03-10' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Active', joined: '2024-04-05' },
  ];

  return (
    <SurfaceCard className="">
      <h3 className="text-base font-semibold text-white mb-4">User Management</h3>
      <div className="overflow-x-auto text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-border/60 text-[11px] uppercase tracking-wide text-brand-text-secondary">
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Email</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3 font-medium">Joined</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-brand-border/40 hover:bg-brand-surface-2">
                <td className="py-2.5 px-3 text-white font-medium">{user.name}</td>
                <td className="py-2.5 px-3 text-brand-text-secondary">{user.email}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    user.status === 'Active' 
                      ? 'bg-green-500/15 text-green-300 border border-green-500/30' 
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-brand-text-secondary">{user.joined}</td>
                <td className="py-2.5 px-3">
                  <button className="text-brand-blue hover:underline text-xs font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
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
    <SurfaceCard>
      <h3 className="text-base font-semibold text-white mb-4">System Logs</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-brand-text-secondary font-mono min-w-max">{log.time}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium min-w-max border ${
              log.level === 'ERROR' ? 'bg-red-500/15 text-red-300 border-red-500/30' :
              log.level === 'WARN' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' :
              'bg-blue-500/15 text-blue-300 border-blue-500/30'
            }`}>
              {log.level}
            </span>
            <span className="text-brand-text-secondary">{log.message}</span>
          </div>
        ))}
      </div>
    </SurfaceCard>
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
    return <div className="flex items-center justify-center min-h-60 text-brand-text-secondary">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-brand-text-secondary text-sm">Welcome back, {adminData?.displayName || 'Super Administrator'}</p>
      </div>
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2"><UserManagement /></div>
        <div className="lg:col-span-2"><SystemLogs /></div>
      </div>
      <SurfaceCard>
        <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['Export Users','System Backup','Clear Cache','Send Notifications','Generate Reports','Maintenance Mode'].map(a => (
            <button key={a} className="text-xs font-medium px-3 py-2 rounded-lg bg-brand-surface-2 border border-brand-border hover:bg-brand-surface transition-colors text-brand-text-secondary hover:text-white">{a}</button>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}