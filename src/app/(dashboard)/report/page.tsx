'use client';

import React from 'react';
import MonthlyComparisonChart from '@/components/reports/MonthlyComparisonChart';
import MonthlySpendChart from '@/components/reports/MonthlySpendChart';
import TransactionsReport from '@/components/reports/TransactionsReport';
import { useData } from '@/hooks/useData';


const ReportPage: React.FC = () => {
  const { incomes, expenses } = useData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-brand-text-primary mb-6">Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MonthlyComparisonChart incomes={incomes} expenses={expenses} />
        <MonthlySpendChart expenses={expenses} />
      </div>

      <div className="mt-6">
        <TransactionsReport incomes={incomes} expenses={expenses} />
      </div>
    </div>
  );
};

export default ReportPage;
