import React from 'react';
import { SellerStatsResponse } from '../../services/sellerService';
import { ProviderProfile } from '../../services/providerService';
import { ListingToggle } from './ListingToggle';
import { Badge } from '../common/Badge';

export interface SellerOverviewProps {
  profile: ProviderProfile;
  stats: SellerStatsResponse;
  onLiveToggled: (newStatus: boolean) => void;
}

export const SellerOverview: React.FC<SellerOverviewProps> = ({
  profile,
  stats,
  onLiveToggled,
}) => {
  const kpis = [
    {
      title: 'Profile Views',
      value: stats.profileViews,
      icon: '👁️',
      color: 'from-blue-500 to-indigo-600',
      description: 'Local customers in Ara',
    },
    {
      title: 'Call Inquiries',
      value: stats.callClicks,
      icon: '📞',
      color: 'from-emerald-500 to-teal-600',
      description: 'Direct call leads generated',
    },
    {
      title: 'WhatsApp Chats',
      value: stats.whatsappClicks,
      icon: '💬',
      color: 'from-green-500 to-emerald-600',
      description: 'Direct message chats initiated',
    },
    {
      title: 'Customer Rating',
      value: stats.avgRating ? stats.avgRating.toFixed(1) : 'New',
      icon: '⭐',
      color: 'from-amber-400 to-orange-500',
      description: `Based on ${stats.reviewCount} customer reviews`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.nameEn}</h2>
            <Badge
              variant={
                stats.status === 'approved'
                  ? 'verified'
                  : stats.status === 'pending'
                  ? 'pending'
                  : 'closed'
              }
            >
              {stats.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Primary Area: <strong className="text-slate-700">{profile.area}, Ara</strong> ·
            Starting from <strong className="text-indigo-600">₹{profile.fromPrice}</strong>
          </p>
        </div>

        <ListingToggle
          isLive={stats.isLive}
          status={stats.status}
          onToggled={onLiveToggled}
        />
      </div>

      {/* 4 KPI Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {kpi.title}
              </span>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpi.value}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips Box */}
      <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3.5 text-xs text-indigo-900">
        <span className="text-xl">💡</span>
        <div className="space-y-1">
          <h4 className="font-bold text-indigo-950">How to get more customer calls in Ara</h4>
          <p className="text-indigo-800/90 leading-relaxed">
            Keep your services catalogue updated with competitive starting rates. Promptly answer incoming customer calls from Ara numbers to maintain a 5-star reputation!
          </p>
        </div>
      </div>
    </div>
  );
};
