import React from 'react';
import type { Campaign } from '../../types';
import { DotsHorizontalIcon, PlusIcon, ArrowLeftIcon, ArrowRightIcon } from '../icons/NavIcons';

const campaigns: Campaign[] = [
    { name: 'Pela Design', followers: '3,074', change: '+9.23%', avatars: ['1', '2', '3', '4'] },
    { name: 'Elexir Ads', followers: '2,931', change: '+7.59%', avatars: ['5', '6', '7', '8'] }
];

const CardBase: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-brand-surface rounded-2xl p-6 relative
                   border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50
                   ${className}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]"></div>
        <div className="relative z-10">
            {children}
        </div>
    </div>
);


const AvatarStack: React.FC<{ avatars: string[], count: string }> = ({ avatars, count }) => (
    <div className="flex items-center">
        {avatars.map(id => (
            <img key={id} src={`https://i.pravatar.cc/24?u=${id}`} alt="avatar" className="w-6 h-6 rounded-full border-2 border-brand-surface-2 -ml-2 first:ml-0" />
        ))}
        <div className="w-6 h-6 rounded-full bg-brand-surface-2 flex items-center justify-center text-xs font-bold text-brand-text-secondary border-2 border-brand-surface -ml-2">
            +{count}
        </div>
        <button className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black border-2 border-brand-surface-2 -ml-2 hover:bg-gray-200 transition-colors">
          <PlusIcon className="w-4 h-4"/>
        </button>
    </div>
);

const SingleCampaignCard: React.FC<{ campaign: Campaign }> = ({ campaign }) => (
    <div className="bg-brand-surface-2 p-4 rounded-xl border border-brand-border hover:border-white/20 transition-colors flex-1">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <p className="font-semibold text-sm">{campaign.name}</p>
            </div>
            <DotsHorizontalIcon className="w-5 h-5 text-brand-text-secondary" />
        </div>
        <p className="text-xl font-bold">{campaign.followers} <span className="text-base font-normal text-brand-text-secondary">Followers</span></p>
        <p className="text-xs text-green-400 mb-3">{campaign.change}</p>
        <AvatarStack avatars={campaign.avatars} count="99+" />
    </div>
);

const TopCampaignsCard: React.FC = () => {
    return (
        <CardBase>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">My Top Campaigns</h3>
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-brand-text-secondary">02 of 5</p>
                    <button className="p-1 text-brand-text-secondary bg-brand-surface-2 border border-brand-border rounded-md hover:border-white/20 transition-colors"><ArrowLeftIcon className="w-4 h-4" /></button>
                     <button className="p-1 text-brand-text-secondary bg-brand-surface-2 border border-brand-border rounded-md hover:border-white/20 transition-colors"><ArrowRightIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                {campaigns.map(c => <SingleCampaignCard key={c.name} campaign={c} />)}
            </div>
        </CardBase>
    );
};

export default TopCampaignsCard;