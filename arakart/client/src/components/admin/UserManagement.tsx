import React, { useState } from 'react';
import { AdminUserItem, suspendUser } from '../../services/adminService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

export interface UserManagementProps {
  users: AdminUserItem[];
  onUserUpdated: (userId: string, newSuspended: boolean) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onUserUpdated,
}) => {
  const { addToast } = useUiStore();
  const { user: currentUser } = useAuthStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleSuspend = async (user: AdminUserItem) => {
    setLoadingId(user.id);
    const targetStatus = !user.suspended;
    try {
      await suspendUser(user.id, targetStatus);
      onUserUpdated(user.id, targetStatus);
      addToast(
        `User ${user.name} has been ${targetStatus ? 'suspended' : 're-activated'}`,
        targetStatus ? 'info' : 'success'
      );
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          Platform Users ({users.length})
        </h3>
        <span className="text-xs text-slate-400">Manage customer & merchant accounts</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isCurrentUser = Boolean(
                currentUser && (
                  (currentUser.id && currentUser.id === u.id) ||
                  (currentUser._id && currentUser._id === u.id) ||
                  (currentUser.id && (u as any)._id && currentUser.id === (u as any)._id) ||
                  (currentUser.email && u.email && currentUser.email.toLowerCase() === u.email.toLowerCase())
                )
              );
              const isSelfAdmin = isCurrentUser && (currentUser?.role === 'admin' || u.role === 'admin');
              const cannotSuspend = isSelfAdmin || u.role === 'admin';

              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{u.name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div>{u.phone || '—'}</div>
                    {u.email && <div className="text-xs text-slate-400">{u.email}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'seller'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.suspended ? (
                      <Badge variant="closed">Suspended</Badge>
                    ) : (
                      <Badge variant="open">Active</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {cannotSuspend ? (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {isCurrentUser ? 'Cannot suspend self' : 'Admin'}
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="md"
                        loading={loadingId === u.id}
                        onClick={() => handleToggleSuspend(u)}
                        className={u.suspended ? 'text-emerald-600 border-emerald-300' : 'text-rose-600 border-rose-200'}
                      >
                        {u.suspended ? 'Unsuspend' : 'Suspend'}
                      </Button>
                    )}
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
