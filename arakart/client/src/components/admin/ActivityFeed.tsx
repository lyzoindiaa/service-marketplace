import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminActivityItem } from '../../services/adminService';

export interface ActivityFeedProps {
  activity: AdminActivityItem[];
}

type ActivityFilter = 'all' | 'lead' | 'review' | 'seller';

const ITEMS_PER_PAGE = 5;

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [page, setPage] = useState(1);

  const filteredActivity = useMemo(() => {
    if (filter === 'all') return activity;
    return activity.filter((item) => item.type === filter);
  }, [activity, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleItems = filteredActivity.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  if (activity.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">
        No platform activity recorded yet.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return '📞';
      case 'review':
        return '⭐';
      case 'seller':
        return '🏪';
      default:
        return '⚡';
    }
  };

  const filterTabs: { id: ActivityFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'lead', label: '📞 Leads' },
    { id: 'review', label: '⭐ Reviews' },
    { id: 'seller', label: '🏪 Sellers' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold text-slate-900">Live Platform Activity</h3>
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Real-time
        </span>
      </div>

      {/* Compact Type Filter Pills */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setFilter(tab.id);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
              filter === tab.id
                ? 'bg-brand-primary text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No {filter} activity found.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visibleItems.map((item) => (
            <div key={item.id} className="py-2.5 flex items-start gap-3 text-xs">
              <span className="text-base shrink-0">{getIcon(item.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 leading-snug truncate" title={item.description}>
                  {item.description}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="text-[11px] font-medium">
            Page {safePage} of {totalPages} ({filteredActivity.length} events)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous activity page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next activity page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
