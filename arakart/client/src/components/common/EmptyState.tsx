import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center py-12 px-6 sm:p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-xs ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mb-4">
        {icon || '🔍'}
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
