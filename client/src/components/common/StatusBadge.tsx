import React from 'react';
import { ConditionType, StockStatusType } from '../../types';

interface StatusBadgeProps {
  type?: 'condition' | 'stock';
  value?: ConditionType | StockStatusType | string;
  condition?: ConditionType | string;
  stock?: StockStatusType | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  condition,
  stock,
  size = 'md',
}) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Determine if this is condition or stock
  const isCondition = type === 'condition' || condition !== undefined;
  const targetValue = value || condition || stock;

  if (isCondition) {
    let colorClasses = 'bg-[#f5f5f7] border-black/10 text-[#424245]';
    let dotColor = 'bg-[#86868b]';

    if (targetValue === 'Like New') {
      colorClasses = 'bg-[#f0fdf4] border-emerald-200 text-emerald-800';
      dotColor = 'bg-emerald-500';
    } else if (targetValue === 'Excellent') {
      colorClasses = 'bg-[#f0f6ff] border-blue-200 text-[#0071e3]';
      dotColor = 'bg-[#0071e3]';
    } else if (targetValue === 'Very Good' || targetValue === 'Good') {
      colorClasses = 'bg-[#fefce8] border-amber-200 text-amber-800';
      dotColor = 'bg-amber-500';
    } else if (targetValue === 'Refurbished') {
      colorClasses = 'bg-[#faf5ff] border-purple-200 text-purple-800';
      dotColor = 'bg-purple-500';
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-sm transition-colors ${colorClasses} ${
          isSmall
            ? 'text-[11px] px-2 py-0.5'
            : isLarge
            ? 'text-xs px-3 py-1'
            : 'text-xs px-2.5 py-0.5'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{targetValue}</span>
      </span>
    );
  }

  // Stock status badge
  let label = 'In Stock';
  let dotClass = 'bg-emerald-500';
  let containerClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';

  if (targetValue === 'LOW_STOCK') {
    label = 'Low Stock';
    dotClass = 'bg-amber-500 animate-pulse';
    containerClass = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (targetValue === 'SOLD_OUT') {
    label = 'Sold Out';
    dotClass = 'bg-[#86868b]';
    containerClass = 'text-[#86868b] bg-[#f5f5f7] border-black/10';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm transition-colors ${containerClass} ${
        isSmall
          ? 'text-[11px] px-2 py-0.5'
          : isLarge
          ? 'text-xs px-3 py-1'
          : 'text-xs px-2.5 py-0.5'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
