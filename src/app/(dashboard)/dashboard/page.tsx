import React from 'react';
import Header from '@/components/layout/Header';
import MyCampaignsCard from '@/components/dashboard/AccountsHeader'; // Repurposed for MyCampaignsCard
import OverviewChart from '@/components/dashboard/CashFlowChart'; // Repurposed for OverviewChart
import TopCampaignsCard from '@/components/dashboard/ActionButtons'; // Repurposed for TopCampaignsCard
import TotalBalanceCard from '@/components/dashboard/StatCard'; // Repurposed for TotalBalanceCard
import AdsCard from '@/components/dashboard/BillPaymentList'; // Repurposed for AdsCard
import PremiumCard from '@/components/dashboard/DonutChartCard'; // Repurposed for PremiumCard
import PopularCampaignsTable from '@/components/dashboard/TransactionsTable'; // Repurposed for PopularCampaignsTable

const DashboardPage: React.FC = () => {
  return (
    <div className="p-8">
      <Header />
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
    </div>
  );
};

export default DashboardPage;
