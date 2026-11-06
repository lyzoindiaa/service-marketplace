import React from 'react';
import { AdminDashboardStats } from '../../services/adminService';

export interface AdminKpiStripProps {
  stats: AdminDashboardStats;
}

export const AdminKpiStrip: React.FC<AdminKpiStripProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Registered Users',
      value: stats.totalUsers,
      sub: 'Customers & Sellers',
      icon: '👥',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Approved Providers',
      value: stats.approvedSellers,
      sub: 'Live in Ara',
      icon: '🏪',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingSellers,
      sub: 'Applications to review',
      icon: '⏳',
      color: 'from-amber-400 to-orange-500',
      highlight: stats.pendingSellers > 0,
    },
    {
      label: 'Customer Leads',
      value: stats.totalLeads,
      sub: `${stats.callsCount} calls • ${stats.whatsappCount} WA`,
      icon: '📈',
      color: 'from-indigo-500 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`p-5 rounded-2xl bg-white border shadow-xs flex flex-col justify-between transition-all ${
            card.highlight
              ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {card.label}
            </span>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {card.value}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
