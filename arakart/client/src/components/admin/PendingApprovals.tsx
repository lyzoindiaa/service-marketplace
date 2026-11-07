import React, { useState, useEffect } from 'react';
import { approveSeller, approveSellerWithCategory, rejectSeller } from '../../services/adminService';
import { fetchCategories, CategoryItem } from '../../services/discoveryService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useUiStore } from '../../store/uiStore';

export interface PendingApprovalsProps {
  sellers: any[];
  onActionComplete: () => void;
}

const EMOJI_OPTIONS = ['🔧', '📹', '🧵', '🧹', '🎨', '🚗', '💇', '⚡', '📦', '💻', '🩺', '🍳'];

export const PendingApprovals: React.FC<PendingApprovalsProps> = ({
  sellers,
  onActionComplete,
}) => {
  const { addToast } = useUiStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [existingCategories, setExistingCategories] = useState<CategoryItem[]>([]);

  // Create Category Modal state
  const [createModalSeller, setCreateModalSeller] = useState<any | null>(null);
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameHi, setCatNameHi] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('🔧');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Remap Category Modal state
  const [remapModalSeller, setRemapModalSeller] = useState<any | null>(null);
  const [targetCategorySlug, setTargetCategorySlug] = useState('');
  const [remapError, setRemapError] = useState<string | null>(null);
  const [isRemapping, setIsRemapping] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setExistingCategories(cats);
        if (cats.length > 0 && !targetCategorySlug) {
          setTargetCategorySlug(cats[0].slug);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await approveSeller(id);
      addToast('Seller approved and published live!', 'success');
      onActionComplete();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to approve seller', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      await rejectSeller(id, 'Admin review criteria not met');
      addToast('Seller application rejected', 'info');
      onActionComplete();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to reject seller', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const openCreateModal = (seller: any) => {
    const req = seller.requestedCategory || {};
    const initialEn = req.nameEn || '';
    const slugified = initialEn
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setCreateModalSeller(seller);
    setCatNameEn(initialEn);
    setCatNameHi(req.nameHi || initialEn);
    setCatSlug(slugified);
    setCatIcon('🔧');
    setCreateError(null);
  };

  const handleConfirmCreateCategory = async () => {
    if (!createModalSeller) return;
    if (!catNameEn.trim() || catNameEn.trim().length < 2) {
      setCreateError('Category English name must be at least 2 characters');
      return;
    }
    if (!catNameHi.trim()) {
      setCreateError('Category Hindi name is required');
      return;
    }
    if (!catSlug.trim()) {
      setCreateError('Category URL slug is required');
      return;
    }

    setIsCreatingCategory(true);
    setCreateError(null);
    try {
      await approveSellerWithCategory(createModalSeller.id, {
        action: 'create',
        categoryData: {
          nameEn: catNameEn.trim(),
          nameHi: catNameHi.trim(),
          slug: catSlug.trim().toLowerCase(),
          icon: catIcon.trim() || '🔧',
        },
      });
      addToast('New category created and seller approved successfully!', 'success');
      setCreateModalSeller(null);
      // Reload categories list to include newly created
      const updatedCats = await fetchCategories();
      setExistingCategories(updatedCats);
      onActionComplete();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to approve with new category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const openRemapModal = (seller: any) => {
    setRemapModalSeller(seller);
    setRemapError(null);
    if (existingCategories.length > 0) {
      setTargetCategorySlug(existingCategories[0].slug);
    }
  };

  const handleConfirmRemap = async () => {
    if (!remapModalSeller) return;
    if (!targetCategorySlug) {
      setRemapError('Please select a target category');
      return;
    }

    setIsRemapping(true);
    setRemapError(null);
    try {
      await approveSellerWithCategory(remapModalSeller.id, {
        action: 'remap',
        targetCategorySlug,
      });
      addToast('Seller approved and mapped to existing category!', 'success');
      setRemapModalSeller(null);
      onActionComplete();
    } catch (err: any) {
      setRemapError(err.response?.data?.message || 'Failed to remap seller category');
    } finally {
      setIsRemapping(false);
    }
  };

  if (sellers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <span className="text-4xl mb-3 block">🎉</span>
        <h3 className="text-base font-bold text-slate-900 mb-1">All Caught Up!</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          There are no pending seller applications awaiting review right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sellers.map((seller) => {
        const hasPendingCategory =
          seller.requestedCategory &&
          seller.requestedCategory.nameEn &&
          (seller.requestedCategory.status === 'pending' || !seller.requestedCategory.status);

        return (
          <div
            key={seller.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">{seller.nameEn}</h3>
                <Badge variant="pending">Pending Review</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">📍 {seller.area}</span>
                <span>&bull;</span>
                <span>📞 {seller.phone}</span>
                {seller.owner && (
                  <>
                    <span>&bull;</span>
                    <span>Owner: {seller.owner.name}</span>
                  </>
                )}
              </div>

              {seller.categories && seller.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {seller.categories.map((cat: string) => (
                    <span
                      key={cat}
                      className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Requested Unlisted Category Highlight */}
              {seller.requestedCategory?.nameEn && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>💡</span> Proposed New Category:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-200/80 text-amber-900">
                      {seller.requestedCategory.status || 'pending'}
                    </span>
                  </div>
                  <div className="text-slate-800">
                    <span className="font-bold text-amber-950">
                      {seller.requestedCategory.nameEn}
                    </span>
                    {seller.requestedCategory.nameHi && (
                      <span className="text-slate-600 font-hindi ml-1.5">
                        ({seller.requestedCategory.nameHi})
                      </span>
                    )}
                  </div>
                  {seller.requestedCategory.description && (
                    <p className="text-slate-600 text-[11px] mt-1 italic">
                      "{seller.requestedCategory.description}"
                    </p>
                  )}
                </div>
              )}

              {seller.services && seller.services.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-600 block mb-1">
                    Catalogue Preview:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {seller.services.map((srv: any, idx: number) => (
                      <span
                        key={idx}
                        className="bg-indigo-50/70 border border-indigo-100/80 text-indigo-800 px-2.5 py-1 rounded-lg"
                      >
                        {srv.nameEn} (₹{srv.startingPrice})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch md:items-end gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Button
                variant="outline"
                size="md"
                loading={loadingId === seller.id}
                onClick={() => handleReject(seller.id)}
              >
                Reject
              </Button>

              {hasPendingCategory ? (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => openRemapModal(seller)}
                  >
                    Remap Category
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => openCreateModal(seller)}
                  >
                    Approve & Create Cat
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  loading={loadingId === seller.id}
                  onClick={() => handleApprove(seller.id)}
                >
                  Approve Seller
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal: Create Category & Approve Seller */}
      <Modal
        isOpen={!!createModalSeller}
        onClose={() => setCreateModalSeller(null)}
        title="Approve Seller & Create Category"
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {createError}
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Review and adjust details for the proposed category. Approving will create this category in AraKart and immediately publish <strong>{createModalSeller?.nameEn}</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Category Name (English) *
            </label>
            <Input
              type="text"
              value={catNameEn}
              onChange={(e) => {
                setCatNameEn(e.target.value);
                setCatSlug(
                  e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                );
              }}
              placeholder="e.g. CCTV Camera Installation"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Category Name (Hindi) *
            </label>
            <Input
              type="text"
              value={catNameHi}
              onChange={(e) => setCatNameHi(e.target.value)}
              placeholder="e.g. सीसीटीवी कैमरा इंस्टॉलेशन"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              URL Slug *
            </label>
            <Input
              type="text"
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. cctv-camera"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Category Emoji Icon
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl p-1 bg-slate-100 rounded-lg border border-slate-200 w-10 text-center">
                {catIcon}
              </span>
              <Input
                type="text"
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                maxLength={4}
                className="w-24"
                placeholder="Icon"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setCatIcon(emoji)}
                  className={`text-base p-1.5 rounded-lg border transition-all ${
                    catIcon === emoji
                      ? 'border-indigo-600 bg-indigo-50 scale-110 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setCreateModalSeller(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              loading={isCreatingCategory}
              onClick={handleConfirmCreateCategory}
            >
              Confirm & Publish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Remap Category & Approve Seller */}
      <Modal
        isOpen={!!remapModalSeller}
        onClose={() => setRemapModalSeller(null)}
        title="Remap Category & Approve Seller"
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          {remapError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {remapError}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
            <span>Seller requested: </span>
            <strong>{remapModalSeller?.requestedCategory?.nameEn}</strong>
            {remapModalSeller?.requestedCategory?.description && (
              <p className="mt-1 italic text-slate-600">
                "{remapModalSeller.requestedCategory.description}"
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Select an existing active category to associate with <strong>{remapModalSeller?.nameEn}</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Target Existing Category *
            </label>
            <select
              value={targetCategorySlug}
              onChange={(e) => setTargetCategorySlug(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium"
            >
              {existingCategories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.icon} {cat.nameEn} ({cat.nameHi}) [{cat.slug}]
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setRemapModalSeller(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              loading={isRemapping}
              onClick={handleConfirmRemap}
            >
              Confirm & Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
