import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'currentColor',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }[size];

  return (
    <div
      data-testid="spinner"
      className={`inline-block animate-spin rounded-full border-solid border-t-transparent ${sizeClasses} ${className}`}
      style={{ borderColor: color, borderTopColor: 'transparent' }}
      role="status"
      aria-label="Loading"
    />
  );
};
