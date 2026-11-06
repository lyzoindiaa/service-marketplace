import React, { useState } from 'react';
import { approveSeller, rejectSeller } from '../../services/adminService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useUiStore } from '../../store/uiStore';

export interface PendingApprovalsProps {
  sellers: any[];
  onActionComplete: () => void;
}

export const PendingApprovals: React.FC<PendingApprovalsProps> = ({
  sellers,
  onActionComplete,
}) => {
  const { addToast } = useUiStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await approveSeller(id);
      addToast('Seller approved and published live!', 'success');
      onActionComplete();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to approve seller', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      await rejectSeller(id, 'Admin review criteria not met');
      addToast('Seller application rejected', 'info');
      onActionComplete();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to reject seller', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  if (sellers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <span className="text-4xl mb-3 block">🎉</span>
        <h3 className="text-base font-bold text-slate-900 mb-1">All Caught Up!</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          There are no pending seller applications awaiting review right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sellers.map((seller) => (
        <div
          key={seller.id}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900">{seller.nameEn}</h3>
              <Badge variant="pending">Pending Review</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">📍 {seller.area}</span>
              <span>&bull;</span>
              <span>📞 {seller.phone}</span>
              {seller.owner && (
                <>
                  <span>&bull;</span>
                  <span>Owner: {seller.owner.name}</span>
                </>
              )}
            </div>

            {seller.categories && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {seller.categories.map((cat: string) => (
                  <span
                    key={cat}
                    className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {seller.services && seller.services.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-600 block mb-1">
                  Catalogue Preview:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {seller.services.map((srv: any, idx: number) => (
                    <span
                      key={idx}
                      className="bg-indigo-50/70 border border-indigo-100/80 text-indigo-800 px-2.5 py-1 rounded-lg"
                    >
                      {srv.nameEn} (₹{srv.startingPrice})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            <Button
              variant="outline"
              size="sm"
              loading={loadingId === seller.id}
              onClick={() => handleReject(seller.id)}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={loadingId === seller.id}
              onClick={() => handleApprove(seller.id)}
            >
              Approve Seller
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
