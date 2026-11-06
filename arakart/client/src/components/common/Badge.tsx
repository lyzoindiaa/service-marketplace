import React from 'react';

export type BadgeVariant =
  | 'verified'
  | 'primary'
  | 'open'
  | 'closed'
  | 'pending'
  | 'category'
  | 'success';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'category',
  className = '',
  icon,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    verified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    category: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
