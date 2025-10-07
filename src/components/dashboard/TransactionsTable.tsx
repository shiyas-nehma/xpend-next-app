import React from 'react';
import type { PopularCampaign } from '@/types';
import { ChevronDownIcon } from '@/components/icons/NavIcons';

const campaigns: PopularCampaign[] = [
  { rank: 1, name: 'IBO Adve...', admin: { name: 'Samuel', avatar: 'c1' }, dateAdded: '02/14/2019', business: 'Advertising', followers: { avatars: ['f1', 'f2', 'f3', 'f4'], count: '99+' }, status: 'Public', operation: 'Join' },
  { rank: 2, name: 'Pela Des...', admin: { name: 'Hossein', avatar: 'c2', isYou: true }, dateAdded: '09/23/2017', business: 'Design Agency', followers: { avatars: ['f5', 'f6', 'f7'], count: '99+' }, status: 'Public', operation: 'Join' },
  { rank: 3, name: 'Emma Fa...', admin: { name: 'Maria', avatar: 'c3' }, dateAdded: '04/05/2023', business: 'Social Fandom', followers: { avatars: ['f8', 'f9', 'f10', 'f11'], count: '99+' }, status: 'Private', operation: 'Request' },
  { rank: 4, name: 'Anaco Pr...', admin: { name: 'Stepha...', avatar: 'c4' }, dateAdded: '11/18/2021', business: 'Programming', followers: { avatars: ['f12', 'f13'], count: '99+' }, status: 'Public', operation: 'Join' },
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

const FollowerStack: React.FC<{ followers: { avatars: string[], count: string } }> = ({ followers }) => (
    <div className="flex items-center">
        {followers.avatars.map(id => (
            <img key={id} src={`https://i.pravatar.cc/24?u=${id}`} alt="avatar" className="w-6 h-6 rounded-full border-2 border-brand-surface -ml-2 first:ml-0" />
        ))}
        <div className="w-6 h-6 rounded-full bg-brand-surface-2 flex items-center justify-center text-xs font-bold text-brand-text-secondary border-2 border-brand-surface -ml-2">
            +{followers.count}
        </div>
    </div>
);


const CampaignRow: React.FC<{ campaign: PopularCampaign }> = ({ campaign }) => (
    <tr className="border-b border-brand-border last:border-b-0 hover:bg-white/5 transition-colors duration-300">
        <td className="py-3 px-4 text-sm text-brand-text-secondary">#{campaign.rank}</td>
        <td className="py-3 px-4 font-medium text-sm">{campaign.name}</td>
        <td className="py-3 px-4">
            <div className="flex items-center space-x-2">
                <img src={`https://i.pravatar.cc/24?u=${campaign.admin.avatar}`} alt={campaign.admin.name} className="w-6 h-6 rounded-full" />
                <span className="text-sm">{campaign.admin.name} {campaign.admin.isYou && <span className="text-xs text-brand-text-secondary">(You)</span>}</span>
            </div>
        </td>
        <td className="py-3 px-4 text-sm text-brand-text-secondary">{campaign.dateAdded}</td>
        <td className="py-3 px-4 text-sm text-brand-text-secondary">{campaign.business}</td>
        <td className="py-3 px-4"><FollowerStack followers={campaign.followers} /></td>
        <td className="py-3 px-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-md ${campaign.status === 'Public' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {campaign.status}
            </span>
        </td>
        <td className="py-3 px-4">
            <button className={`w-24 text-sm font-semibold py-1.5 rounded-md transition-all duration-300 ${campaign.operation === 'Join' 
              ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]' 
              : 'bg-brand-surface-2 border border-brand-border hover:bg-brand-border hover:border-white/20'}`}>
                {campaign.operation}
            </button>
        </td>
    </tr>
);

const PopularCampaignsTable: React.FC = () => {
  return (
    <CardBase className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Popular Campaigns</h3>
        <div className="flex items-center space-x-2">
            <span className="bg-brand-surface-2 border border-brand-border text-xs font-bold px-2 py-1 rounded-md">#2</span>
            <button className="flex items-center space-x-2 text-sm text-brand-text-secondary bg-brand-surface-2 border border-brand-border px-3 py-1.5 rounded-lg hover:border-white/20 transition-colors">
                <span>as List</span>
                <ChevronDownIcon className="w-4 h-4"/>
            </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-border">
                {['Rank', 'Name', 'Admin', 'Date Added', 'Business', 'Followers', 'Status', 'Operation'].map(h => (
                    <th key={h} className="py-2 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wider">{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <CampaignRow key={campaign.rank} campaign={campaign} />
            ))}
          </tbody>
        </table>
      </div>
    </CardBase>
  );
};

export default PopularCampaignsTable;