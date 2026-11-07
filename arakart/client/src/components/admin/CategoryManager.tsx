import React, { useState } from 'react';
import {
  createAdminCategory,
  toggleAdminCategory,
} from '../../services/adminService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUiStore } from '../../store/uiStore';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

export interface CategoryManagerProps {
  categories: any[];
  onRefresh: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onRefresh,
}) => {
  const { addToast } = useUiStore();

  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameHi, setNewCatNameHi] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔧');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catErrors, setCatErrors] = useState<{ nameEn?: string; slug?: string }>({});

  const handleToggleCat = async (id: string) => {
    try {
      await toggleAdminCategory(id);
      addToast('Category status updated', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to toggle category', 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { nameEn?: string; slug?: string } = {};
    if (!newCatNameEn.trim()) errors.nameEn = 'Category name is required';
    if (!newCatSlug.trim()) errors.slug = 'Category slug is required';

    if (Object.keys(errors).length > 0) {
      setCatErrors(errors);
      const invalidIds: string[] = [];
      if (errors.nameEn) invalidIds.push('admin-cat-name-en');
      if (errors.slug) invalidIds.push('admin-cat-slug');
      setTimeout(() => focusFirstInvalidField(invalidIds), 0);
      addToast(Object.values(errors)[0], 'error');
      return;
    }

    setCatErrors({});
    setIsSubmittingCat(true);
    try {
      await createAdminCategory({
        nameEn: newCatNameEn.trim(),
        nameHi: newCatNameHi.trim() || newCatNameEn.trim(),
        slug: newCatSlug.trim().toLowerCase(),
        icon: newCatIcon || '🔧',
      });
      addToast('Category created successfully!', 'success');
      setNewCatNameEn('');
      setNewCatNameHi('');
      setNewCatSlug('');
      setNewCatIcon('🔧');
      onRefresh();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create category', 'error');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.nameEn?.toLowerCase().includes(q) ||
      cat.nameHi?.toLowerCase().includes(q) ||
      cat.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Service Categories ({categories.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage platform service categories, icons, and discovery visibility.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAddCategory}
        className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3"
      >
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Add New Category
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            id="admin-cat-name-en"
            placeholder="Name (English) *"
            value={newCatNameEn}
            onChange={(e) => {
              setNewCatNameEn(e.target.value);
              setNewCatSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
              if (catErrors.nameEn) setCatErrors((prev) => ({ ...prev, nameEn: undefined }));
              if (catErrors.slug) setCatErrors((prev) => ({ ...prev, slug: undefined }));
            }}
            error={catErrors.nameEn}
          />
          <Input
            placeholder="Name (Hindi) e.g. मैकेनिक"
            value={newCatNameHi}
            onChange={(e) => setNewCatNameHi(e.target.value)}
          />
          <Input
            id="admin-cat-slug"
            placeholder="Slug e.g. electrician *"
            value={newCatSlug}
            onChange={(e) => {
              setNewCatSlug(e.target.value);
              if (catErrors.slug) setCatErrors((prev) => ({ ...prev, slug: undefined }));
            }}
            error={catErrors.slug}
          />
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <Input
                placeholder="Icon"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="md"
              loading={isSubmittingCat}
              className="flex-1 whitespace-nowrap"
            >
              + Add Category
            </Button>
          </div>
        </div>
      </form>

      {/* Categories Table/List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Hindi Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Status & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No categories match your search.
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr key={cat.id || cat.slug} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {cat.icon || '🔧'}
                      </span>
                      <span>{cat.nameEn}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {cat.nameHi || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleCat(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        cat.enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {cat.enabled ? 'Enabled' : 'Disabled'}
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
