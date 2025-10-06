'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import MyCampaignsCard from '../../components/dashboard/AccountsHeader'; // Repurposed for MyCampaignsCard
import OverviewChart from '../../components/dashboard/CashFlowChart'; // Repurposed for OverviewChart
import TopCampaignsCard from '../../components/dashboard/ActionButtons'; // Repurposed for TopCampaignsCard
import TotalBalanceCard from '../../components/dashboard/StatCard'; // Repurposed for TotalBalanceCard
import AdsCard from '../../components/dashboard/BillPaymentList'; // Repurposed for AdsCard
import PremiumCard from '../../components/dashboard/DonutChartCard'; // Repurposed for PremiumCard
import PopularCampaignsTable from '../../components/dashboard/TransactionsTable'; // Repurposed for PopularCampaignsTable

const DashboardPage: React.FC = () => {
  const router = useRouter();

  const handleNavigation = (page: string) => {
    const pageRoutes: { [key: string]: string } = {
      'Dashboard': '/dashboard',
      'AI': '/all',
      'Accounts': '/accounts',
      'Income': '/income',
      'Expense': '/expense',
      'Category': '/category',
      'Budget': '/budget',
      'Goals': '/goals',
      'Report': '/report',
      'Settings': '/settings',
      'Logout': '/login'
    };
    
    const route = pageRoutes[page];
    if (route) {
      router.push(route);
    }
  };

  return (
    <div className="flex h-screen bg-brand-background">
      <Sidebar activePage="Dashboard" onNavigate={handleNavigation} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MyCampaignsCard />
          <OverviewChart />
          <TopCampaignsCard />
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-2">
          <TotalBalanceCard />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <AdsCard />
          <PremiumCard />
        </div>

        {/* Bottom Row */}
        <div className="lg:col-span-5">
          <PopularCampaignsTable />
        </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
