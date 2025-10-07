import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import type { Income, Expense } from '@/types';
import ReportCard from '@/components/reports/ReportCard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find(p => p.dataKey === 'Income')?.value || 0;
    const expense = payload.find(p => p.dataKey === 'Expense')?.value || 0;
    const net = payload.find(p => p.dataKey === 'Net Flow')?.value || 0;
    return (
      <div className="bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-brand-border shadow-lg text-sm">
        <p className="font-bold text-white mb-2">{label}</p>
        <p className="text-blue-400">{`Income: $${income.toLocaleString()}`}</p>
        <p className="text-red-400">{`Expense: $${expense.toLocaleString()}`}</p>
        <p className="text-brand-yellow font-semibold">{`Net Flow: $${net.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

interface FinancialSummaryChartProps {
    incomes: Income[];
    expenses: Expense[];
}

const FinancialSummaryChart: React.FC<FinancialSummaryChartProps> = ({ incomes, expenses }) => {
  const data = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataByMonth: { [key: string]: { income: number; expense: number } } = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        dataByMonth[monthKey] = { income: 0, expense: 0 };
    }
    
    // Populate with income data
    incomes.forEach(i => {
        const date = new Date(i.date);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (dataByMonth.hasOwnProperty(monthKey)) {
            dataByMonth[monthKey].income += i.amount;
        }
    });

    // Populate with expense data
    expenses.forEach(e => {
        const date = new Date(e.date);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (dataByMonth.hasOwnProperty(monthKey)) {
            dataByMonth[monthKey].expense += e.amount;
        }
    });

    return Object.keys(dataByMonth).map(monthKey => ({
        month: monthKey.split(' ')[0],
        Income: dataByMonth[monthKey].income,
        Expense: dataByMonth[monthKey].expense,
        'Net Flow': dataByMonth[monthKey].income - dataByMonth[monthKey].expense,
    }));

  }, [incomes, expenses]);

  return (
    <ReportCard title="6-Month Financial Summary">
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="#2D2D2D" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#8A8A8A" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#8A8A8A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Legend wrapperStyle={{fontSize: "14px"}} />
            <Bar dataKey="Income" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expense" fill="#ef4444" barSize={20} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="Net Flow" stroke="#FFC700" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ReportCard>
  );
};

export default FinancialSummaryChart;
