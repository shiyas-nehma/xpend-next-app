import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Expense } from '../../types';
import ReportCard from './ReportCard';

const COLORS = ['#5D78FF', '#FFC700', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-brand-border shadow-lg text-sm">
        <p className="font-bold text-white flex items-center">
            <span style={{backgroundColor: payload[0].fill}} className="w-3 h-3 rounded-full mr-2"></span>
            {data.name}
        </p>
        <p className="text-brand-text-primary mt-1">{`Amount: $${data.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</p>
        <p className="text-brand-text-secondary">{`(${data.percent}%)`}</p>
      </div>
    );
  }
  return null;
};

interface CategorySpendDonutProps {
    expenses: Expense[];
}

const CategorySpendDonut: React.FC<CategorySpendDonutProps> = ({ expenses }) => {
    const { chartData, totalExpenses } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const total = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

        const spendByCategory = new Map<string, number>();
        monthlyExpenses.forEach(e => {
            const categoryName = e.category.name;
            spendByCategory.set(categoryName, (spendByCategory.get(categoryName) || 0) + e.amount);
        });
        
        const data = Array.from(spendByCategory.entries()).map(([name, value]) => ({
            name,
            value,
            percent: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
        })).sort((a, b) => b.value - a.value);

        return { chartData: data, totalExpenses: total };
    }, [expenses]);

    return (
        <ReportCard title="Expense Breakdown (This Month)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center" style={{ width: '100%', height: 300 }}>
                <div className="relative h-full w-full">
                     <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                cornerRadius={5}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-sm text-brand-text-secondary">Total Spent</p>
                        <p className="text-2xl font-bold text-brand-text-primary">
                            ${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                    </div>
                </div>
                <div className="h-full overflow-y-auto pr-2 max-h-[280px]">
                    {chartData.length > 0 ? (
                        <ul className="flex flex-col space-y-2 text-sm">
                             {chartData.map((entry, index) => (
                                <li key={`item-${index}`} className="flex items-center justify-between p-2 rounded-md hover:bg-brand-surface-2">
                                    <div className="flex items-center min-w-0">
                                        <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        <span className="text-brand-text-secondary truncate" title={entry.name}>{entry.name}</span>
                                    </div>
                                    <span className="font-semibold text-brand-text-primary ml-2">${entry.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </li>
                             ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-full text-brand-text-secondary">
                            No expenses this month.
                        </div>
                    )}
                </div>
            </div>
        </ReportCard>
    );
};

export default CategorySpendDonut;
