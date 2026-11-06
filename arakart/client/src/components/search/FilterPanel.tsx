import React from 'react';
import { CategoryItem } from '../../services/discoveryService';
import { useUiStore } from '../../store/uiStore';

export interface FilterPanelProps {
  selectedCategory?: string;
  selectedArea?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  categories: CategoryItem[];
  areas: string[];
  onCategoryChange: (category: string) => void;
  onAreaChange: (area: string) => void;
  onMinRatingChange: (rating: number) => void;
  onVerifiedChange: (verifiedOnly: boolean) => void;
  onReset: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedCategory = '',
  selectedArea = '',
  minRating = 0,
  verifiedOnly = false,
  categories,
  areas,
  onCategoryChange,
  onAreaChange,
  onMinRatingChange,
  onVerifiedChange,
  onReset,
  className = '',
}) => {
  const { language } = useUiStore();

  const hasActiveFilters = Boolean(
    selectedCategory || selectedArea || minRating > 0 || verifiedOnly
  );

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-base font-bold text-slate-900">
            {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {language === 'hi' ? 'रीसेट करें' : 'Reset all'}
          </button>
        )}
      </div>

      <div className="space-y-6 pt-4">
        {/* Category Filter */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {language === 'hi' ? 'श्रेणी' : 'Category'}
          </label>
          <select
            id="filter-category"
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          >
            <option value="">{language === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id || cat.slug} value={cat.slug}>
                {language === 'hi' && cat.nameHi ? cat.nameHi : cat.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Locality Filter */}
        <div>
          <label htmlFor="filter-area" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {language === 'hi' ? 'क्षेत्र / इलाका' : 'Locality'}
          </label>
          <select
            id="filter-area"
            aria-label="Filter by area"
            value={selectedArea}
            onChange={(e) => onAreaChange(e.target.value)}
            className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          >
            <option value="">{language === 'hi' ? 'सभी इलाके' : 'All Localities'}</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Rating */}
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {language === 'hi' ? 'न्यूनतम रेटिंग' : 'Minimum Rating'}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'All', value: 0 },
              { label: '4.0★+', value: 4 },
              { label: '4.5★+', value: 4.5 },
            ].map((option) => {
              const isSelected = minRating === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onMinRatingChange(option.value)}
                  className={`text-xs py-2 px-2.5 rounded-xl font-semibold border transition-all text-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Verified Providers Only Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              {language === 'hi' ? 'केवल सत्यापित प्रदाता' : 'Verified only'}
            </span>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => onVerifiedChange(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
