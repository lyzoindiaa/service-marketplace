import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { fetchCityAreas } from '../../services/discoveryService';

export interface SearchBarProps {
  initialQuery?: string;
  initialArea?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  initialArea = '',
  className = '',
}) => {
  const navigate = useNavigate();
  const selectedCity = useUiStore((s) => s.selectedCity);

  const [q, setQ] = useState(initialQuery);
  const [area, setArea] = useState(initialArea);
  const [areas, setAreas] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchCityAreas(selectedCity)
      .then((data) => {
        if (isMounted && data?.areas) {
          setAreas(data.areas);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (area.trim()) params.set('area', area.trim());

    navigate(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl border border-slate-100 flex flex-col sm:flex-row items-center gap-2 max-w-3xl mx-auto ${className}`}
      role="search"
    >
      {/* Keyword input */}
      <div className="flex-1 flex items-center gap-3 w-full px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-100">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for services (e.g. Electrician, RO Repair, Plumber)..."
          className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
      </div>

      {/* Locality select */}
      <div className="flex items-center gap-2 w-full sm:w-56 px-3 py-2 border-b sm:border-b-0 border-slate-100">
        <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full text-xs sm:text-sm text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          aria-label="Filter by locality"
        >
          <option value="">All Ara Localities</option>
          {areas.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Search Submit Button */}
      <button
        type="submit"
        aria-label="Search"
        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base shrink-0 active:scale-95"
      >
        <Search className="w-4 h-4" />
        <span>Search</span>
      </button>
    </form>
  );
};
