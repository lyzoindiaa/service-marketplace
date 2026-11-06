import React, { useState } from 'react';
import {
  createAdminCategory,
  toggleAdminCategory,
  createAdminCity,
  toggleAdminCity,
} from '../../services/adminService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUiStore } from '../../store/uiStore';

export interface CategoryCityManagerProps {
  categories: any[];
  cities: any[];
  onRefresh: () => void;
}

export const CategoryCityManager: React.FC<CategoryCityManagerProps> = ({
  categories,
  cities,
  onRefresh,
}) => {
  const { addToast } = useUiStore();

  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameHi, setNewCatNameHi] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔧');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const [newCityName, setNewCityName] = useState('');
  const [newCitySlug, setNewCitySlug] = useState('');
  const [newCityState, setNewCityState] = useState('Bihar');
  const [isSubmittingCity, setIsSubmittingCity] = useState(false);

  const handleToggleCat = async (id: string) => {
    try {
      await toggleAdminCategory(id);
      addToast('Category status updated', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to toggle category', 'error');
    }
  };

  const handleToggleCity = async (id: string) => {
    try {
      await toggleAdminCity(id);
      addToast('City status updated', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to toggle city', 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameEn.trim() || !newCatSlug.trim()) {
      addToast('Category name and slug are required', 'error');
      return;
    }
    setIsSubmittingCat(true);
    try {
      await createAdminCategory({
        nameEn: newCatNameEn.trim(),
        nameHi: newCatNameHi.trim() || newCatNameEn.trim(),
        slug: newCatSlug.trim().toLowerCase(),
        icon: newCatIcon,
      });
      addToast('Category created successfully!', 'success');
      setNewCatNameEn('');
      setNewCatNameHi('');
      setNewCatSlug('');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create category', 'error');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim() || !newCitySlug.trim()) {
      addToast('City name and slug are required', 'error');
      return;
    }
    setIsSubmittingCity(true);
    try {
      await createAdminCity({
        name: newCityName.trim(),
        slug: newCitySlug.trim().toLowerCase(),
        state: newCityState.trim(),
      });
      addToast('City created successfully!', 'success');
      setNewCityName('');
      setNewCitySlug('');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create city', 'error');
    } finally {
      setIsSubmittingCity(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Categories */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Service Categories ({categories.length})
          </h3>
          <span className="text-xs text-slate-400">Available across Ara</span>
        </div>

        <form onSubmit={handleAddCategory} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
          <span className="text-xs font-bold text-slate-700 block">Add New Category</span>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Name (English)"
              value={newCatNameEn}
              onChange={(e) => {
                setNewCatNameEn(e.target.value);
                setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
            />
            <Input
              placeholder="Name (Hindi)"
              value={newCatNameHi}
              onChange={(e) => setNewCatNameHi(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Slug"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
            />
            <Input
              placeholder="Icon (Emoji)"
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
            />
            <Button type="submit" size="sm" loading={isSubmittingCat}>
              + Add
            </Button>
          </div>
        </form>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id || cat.slug} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{cat.icon}</span>
                <div>
                  <span className="font-bold text-slate-900">{cat.nameEn}</span>
                  <span className="text-slate-400 text-[11px] ml-1">({cat.slug})</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleCat(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  cat.enabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cities */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Launch Cities ({cities.length})
          </h3>
          <span className="text-xs text-slate-400">Hyperlocal footprint</span>
        </div>

        <form onSubmit={handleAddCity} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
          <span className="text-xs font-bold text-slate-700 block">Add New Market City</span>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="City Name"
              value={newCityName}
              onChange={(e) => {
                setNewCityName(e.target.value);
                setNewCitySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
            />
            <Input
              placeholder="Slug"
              value={newCitySlug}
              onChange={(e) => setNewCitySlug(e.target.value)}
            />
            <Input
              placeholder="State"
              value={newCityState}
              onChange={(e) => setNewCityState(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={isSubmittingCity}>
              + Add City
            </Button>
          </div>
        </form>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {cities.map((city) => (
            <div key={city.id || city.slug} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">{city.name}</span>
                <span className="text-slate-400 text-[11px] ml-1">({city.state})</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleCity(city.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  city.isLive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {city.isLive ? 'Active Market' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
