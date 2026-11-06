import React from 'react';
import { AdminActivityItem } from '../../services/adminService';

export interface ActivityFeedProps {
  activity: AdminActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold text-slate-900">Live Platform Activity</h3>
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Real-time
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {activity.map((item) => (
          <div key={item.id} className="py-2.5 flex items-start gap-3 text-xs">
            <span className="text-base shrink-0">{getIcon(item.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 leading-snug">{item.description}</p>
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
    </div>
  );
};
