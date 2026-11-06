import React from 'react';
import { updateLeadStatus } from '../../services/leadService';
import { useUiStore } from '../../store/uiStore';

export interface LeadItem {
  id: string;
  customer?: string;
  customerName: string;
  customerPhone?: string;
  type: 'call' | 'whatsapp';
  service?: string;
  status: 'new' | 'contacted' | 'completed';
  createdAt: string;
}

export interface LeadsTableProps {
  leads: LeadItem[];
  onStatusUpdated: (leadId: string, newStatus: 'new' | 'contacted' | 'completed') => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onStatusUpdated }) => {
  const { addToast } = useUiStore();

  const handleStatusChange = async (
    leadId: string,
    status: 'new' | 'contacted' | 'completed'
  ) => {
    try {
      await updateLeadStatus(leadId, status);
      onStatusUpdated(leadId, status);
      addToast('Lead status updated', 'success');
    } catch {
      addToast('Failed to update lead status', 'error');
    }
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <span className="text-4xl mb-3 block">📭</span>
        <h3 className="text-base font-bold text-slate-900 mb-1">No Leads Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Customer calls and WhatsApp inquiry clicks will appear here in real-time as local residents discover your business.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          Customer Inquiries ({leads.length})
        </h3>
        <span className="text-xs text-slate-400">Live incoming leads</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Inquiry Type</th>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Date & Time</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const formattedDate = new Date(lead.createdAt).toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {lead.customerName || 'Verified Customer'}
                  </td>
                  <td className="px-5 py-4">
                    {lead.type === 'call' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        📞 Call Inquiry
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        💬 WhatsApp Inquiry
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-medium">
                    {lead.service || 'General Inquiry'}
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-medium">
                    {formattedDate}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        handleStatusChange(
                          lead.id,
                          e.target.value as 'new' | 'contacted' | 'completed'
                        )
                      }
                      className="text-xs font-semibold rounded-lg border border-slate-200 py-1 px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
