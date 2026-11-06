import React from 'react';
import { useUiStore } from '../../store/uiStore';

export interface SortDropdownProps {
  value: string;
  onChange: (sort: string) => void;
  className?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { language } = useUiStore();

  const options = [
    { value: 'rating', labelEn: 'Highest Rated', labelHi: 'सर्वोच्च रेटेड' },
    { value: 'views', labelEn: 'Most Popular', labelHi: 'सर्वाधिक लोकप्रिय' },
    { value: 'price_asc', labelEn: 'Price: Low to High', labelHi: 'कीमत: कम से ज्यादा' },
    { value: 'price_desc', labelEn: 'Price: High to Low', labelHi: 'कीमत: ज्यादा से कम' },
    { value: 'newest', labelEn: 'Newest First', labelHi: 'नवीनतम पहले' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="sort-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
        {language === 'hi' ? 'क्रमबद्ध करें:' : 'Sort by:'}
      </label>
      <select
        id="sort-select"
        aria-label="Sort by"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs sm:text-sm font-medium rounded-xl border border-slate-200 bg-white py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {language === 'hi' ? opt.labelHi : opt.labelEn}
          </option>
        ))}
      </select>
    </div>
  );
};
