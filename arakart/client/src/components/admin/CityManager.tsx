import React, { useState } from 'react';
import {
  createAdminCity,
  toggleAdminCity,
} from '../../services/adminService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUiStore } from '../../store/uiStore';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

export interface CityManagerProps {
  cities: any[];
  onRefresh: () => void;
}

export const CityManager: React.FC<CityManagerProps> = ({
  cities,
  onRefresh,
}) => {
  const { addToast } = useUiStore();

  const [newCityName, setNewCityName] = useState('');
  const [newCitySlug, setNewCitySlug] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [isSubmittingCity, setIsSubmittingCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityErrors, setCityErrors] = useState<{ name?: string; slug?: string }>({});

  const handleToggleCity = async (id: string) => {
    try {
      await toggleAdminCity(id);
      addToast('City status updated', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to toggle city', 'error');
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; slug?: string } = {};
    if (!newCityName.trim()) errors.name = 'City name is required';
    if (!newCitySlug.trim()) errors.slug = 'City slug is required';

    if (Object.keys(errors).length > 0) {
      setCityErrors(errors);
      const invalidIds: string[] = [];
      if (errors.name) invalidIds.push('admin-city-name');
      if (errors.slug) invalidIds.push('admin-city-slug');
      setTimeout(() => focusFirstInvalidField(invalidIds), 0);
      addToast(Object.values(errors)[0], 'error');
      return;
    }

    setCityErrors({});
    setIsSubmittingCity(true);
    try {
      await createAdminCity({
        name: newCityName.trim(),
        nameEn: newCityName.trim(),
        nameHi: newCityName.trim(),
        slug: newCitySlug.trim().toLowerCase(),
        state: newCityState.trim() || 'Bihar',
        stateEn: newCityState.trim() || 'Bihar',
        stateHi: newCityState.trim() || 'बिहार',
      });
      addToast('City created successfully!', 'success');
      setNewCityName('');
      setNewCitySlug('');
      setNewCityState('');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create city', 'error');
    } finally {
      setIsSubmittingCity(false);
    }
  };

  const filteredCities = cities.filter((city) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (city.nameEn || city.name)?.toLowerCase().includes(q) ||
      (city.state || city.stateEn)?.toLowerCase().includes(q) ||
      city.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Launch Cities ({cities.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage active service cities, state regions, and market visibility.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Add City Form */}
      <form
        onSubmit={handleAddCity}
        className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3"
      >
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Add New Market City
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="admin-city-name"
            placeholder="City Name (e.g. Patna) *"
            value={newCityName}
            onChange={(e) => {
              setNewCityName(e.target.value);
              setNewCitySlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
              if (cityErrors.name) setCityErrors((prev) => ({ ...prev, name: undefined }));
              if (cityErrors.slug) setCityErrors((prev) => ({ ...prev, slug: undefined }));
            }}
            error={cityErrors.name}
          />
          <Input
            id="admin-city-slug"
            placeholder="Slug (e.g. patna) *"
            value={newCitySlug}
            onChange={(e) => {
              setNewCitySlug(e.target.value);
              if (cityErrors.slug) setCityErrors((prev) => ({ ...prev, slug: undefined }));
            }}
            error={cityErrors.slug}
          />
          <div className="flex gap-2">
            <Input
              placeholder="State (e.g. Bihar)"
              value={newCityState}
              onChange={(e) => setNewCityState(e.target.value)}
            />
            <Button
              type="submit"
              size="md"
              loading={isSubmittingCity}
              className="shrink-0 whitespace-nowrap"
            >
              + Add City
            </Button>
          </div>
        </div>
      </form>

      {/* Cities Table/List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">State / Region</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Status & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCities.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No cities match your search.
                </td>
              </tr>
            ) : (
              filteredCities.map((city) => (
                <tr key={city.id || city.slug} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📍</span>
                      <span>{city.nameEn || city.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {city.state || city.stateEn || 'Bihar'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                    {city.slug}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleCity(city.id)}
                      title="Click to toggle between Active Market and Hidden"
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        city.isLive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {city.isLive ? 'Active Market' : 'Hidden'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
