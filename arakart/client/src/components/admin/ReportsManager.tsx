import React, { useState } from 'react';
import { AdminReportItem, resolveAdminReport } from '../../services/adminService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useUiStore } from '../../store/uiStore';

export interface ReportsManagerProps {
  reports: AdminReportItem[];
  onReportResolved: (reportId: string, newStatus: 'resolved' | 'dismissed') => void;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  reports,
  onReportResolved,
}) => {
  const { addToast } = useUiStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    setLoadingId(id);
    try {
      await resolveAdminReport(id, status, 'Resolved by admin');
      onReportResolved(id, status);
      addToast(`Report marked as ${status}`, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update report', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <span className="text-4xl mb-3 block">🛡️</span>
        <h3 className="text-base font-bold text-slate-900 mb-1">No Active Reports</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          All customer abuse and listing issue reports have been reviewed and resolved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 text-base">
                Report against: {report.provider?.nameEn || 'Provider'}
              </span>
              <Badge variant={report.status === 'open' ? 'pending' : 'verified'}>
                {report.status.toUpperCase()}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <span className="font-bold text-slate-700">Reason:</span> {report.reason}
              {report.details && (
                <>
                  <br />
                  <span className="font-bold text-slate-700">Details:</span> {report.details}
                </>
              )}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Reported by: {report.reportedBy?.name || 'Customer'}</span>
              <span>&bull;</span>
              <span>
                {new Date(report.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {report.status === 'open' && (
            <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Button
                variant="outline"
                size="sm"
                loading={loadingId === report.id}
                onClick={() => handleResolve(report.id, 'dismissed')}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={loadingId === report.id}
                onClick={() => handleResolve(report.id, 'resolved')}
              >
                Resolve Report
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
