'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { InfoIcon } from '@/components/icons/NavIcons';

const data = [
    { name: 'Mar 8', value: 4000 },
    { name: 'Mar 18', value: 3000 },
    { name: 'Mar 28', value: 4500 },
    { name: 'Mar 29', value: 5538.65 },
    { name: 'Apr 8', value: 4800 },
];

const CardBase: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-brand-surface rounded-2xl p-6 relative
                   border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50
                   ${className}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]"></div>
        <div className="relative z-10 h-full flex flex-col">
            {children}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-brand-border shadow-lg">
        <p className="font-bold text-white text-lg">${payload[0].value.toLocaleString()}</p>
        <p className="text-sm text-green-400">+ 9.41%</p>
      </div>
    );
  }
  return null;
};

const OverviewChart: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Month');

  return (
    <CardBase className="h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Overview</h3>
        <InfoIcon className="w-5 h-5 text-brand-text-secondary" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <div>
            <p className="text-sm text-brand-text-secondary">Max records <span className="text-white font-medium">2 times increase to the last month</span></p>
            <p className="text-sm text-brand-text-secondary">Comparative rates <span className="text-green-400 font-medium">+ 12.83 %</span></p>
        </div>
        <div className="flex space-x-1 bg-brand-surface-2 p-1 rounded-lg border border-brand-border">
            {['24h', 'Week', 'Month'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-brand-surface text-white' : 'text-brand-text-secondary hover:bg-brand-surface'}`}>
                    {tab}
                </button>
            ))}
        </div>
      </div>
      <div className="flex-1 w-full h-48 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5D78FF" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#5D78FF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8A8A8A', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8A8A8A', strokeWidth: 1, strokeDasharray: '3 3' }}/>
            <Line type="monotone" dataKey="value" stroke="#5D78FF" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#5D78FF', stroke: 'white', strokeWidth: 2 }} />
            <ReferenceDot x="Mar 29" y={5538.65} r={8} fill="#5D78FF" stroke="rgba(93, 120, 255, 0.3)" strokeWidth={8} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-end mt-4">
        <p className="text-4xl font-bold text-green-400">+19.23%</p>
        <div>
            <p className="text-xs text-brand-text-secondary text-right">Last updated</p>
            <p className="text-sm font-medium">Today, 06:49 AM</p>
        </div>
      </div>
    </CardBase>
  );
};

export default OverviewChart;