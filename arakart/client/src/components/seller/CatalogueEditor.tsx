import React, { useState } from 'react';
import { updateSellerCatalogue } from '../../services/sellerService';
import { ProviderServiceItem } from '../../services/providerService';
import { Button } from '../common/Button';
import { useUiStore } from '../../store/uiStore';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

export interface CatalogueEditorProps {
  initialServices: ProviderServiceItem[];
  onCatalogueUpdated: (services: ProviderServiceItem[]) => void;
}

export const CatalogueEditor: React.FC<CatalogueEditorProps> = ({
  initialServices,
  onCatalogueUpdated,
}) => {
  const { addToast } = useUiStore();
  const [services, setServices] = useState<ProviderServiceItem[]>(
    initialServices.length > 0 ? initialServices : [{ nameEn: '', startingPrice: 150 }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    setServices([...services, { nameEn: '', startingPrice: 150 }]);
  };

  const handleRemove = (index: number) => {
    if (services.length <= 1) return;
    setServices(services.filter((_, idx) => idx !== index));
  };

  const handleChange = (
    index: number,
    field: 'nameEn' | 'nameHi' | 'startingPrice',
    val: any
  ) => {
    const updated = [...services];
    updated[index] = {
      ...updated[index],
      [field]: field === 'startingPrice' ? Number(val) || 0 : val,
    };
    setServices(updated);
    if (field === 'nameEn' && errors[`srv_name_${index}`]) {
      setErrors((prev) => ({ ...prev, [`srv_name_${index}`]: '' }));
    }
    if (field === 'startingPrice' && errors[`srv_price_${index}`]) {
      setErrors((prev) => ({ ...prev, [`srv_price_${index}`]: '' }));
    }
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    let firstInvalidId: string | null = null;

    services.forEach((s, idx) => {
      if (!s.nameEn.trim()) {
        errs[`srv_name_${idx}`] = 'Service name is required';
        if (!firstInvalidId) firstInvalidId = `cat-service-name-${idx}`;
      }
      if (!s.startingPrice || s.startingPrice <= 0) {
        errs[`srv_price_${idx}`] = 'Starting price must be greater than 0';
        if (!firstInvalidId) firstInvalidId = `cat-service-price-${idx}`;
      }
    });

    if (services.length === 0 || Object.keys(errs).length > 0) {
      setErrors(errs);
      addToast(
        Object.values(errs)[0] || 'Please provide at least 1 valid service with price',
        'error'
      );
      if (firstInvalidId) {
        setTimeout(() => focusFirstInvalidField([firstInvalidId]), 0);
      }
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const res = await updateSellerCatalogue(services);
      onCatalogueUpdated(res.services);
      addToast('Services catalogue updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update catalogue', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Services & Rates Catalogue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prices shown on your public listing to customers.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={handleAdd}>
          + Add Service
        </Button>
      </div>

      <div className="space-y-3">
        {services.map((srv, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="flex-1 w-full">
              <label htmlFor={`cat-service-name-${idx}`} className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Service Name (English) *
              </label>
              <input
                id={`cat-service-name-${idx}`}
                type="text"
                value={srv.nameEn}
                onChange={(e) => handleChange(idx, 'nameEn', e.target.value)}
                placeholder="e.g. Ceiling Fan Bearing Change"
                className={`w-full text-xs rounded-lg border p-2 font-medium transition-colors ${
                  errors[`srv_name_${idx}`]
                    ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                    : 'border-slate-200 bg-white'
                }`}
              />
            </div>

            <div className="w-full sm:w-36">
              <label htmlFor={`cat-service-price-${idx}`} className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Starting Price (₹) *
              </label>
              <input
                id={`cat-service-price-${idx}`}
                type="number"
                value={srv.startingPrice}
                onChange={(e) => handleChange(idx, 'startingPrice', e.target.value)}
                min={0}
                className={`w-full text-xs rounded-lg border p-2 font-medium transition-colors ${
                  errors[`srv_price_${idx}`]
                    ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                    : 'border-slate-200 bg-white'
                }`}
              />
            </div>

            {services.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="sm:self-end mb-1 p-2 text-slate-400 hover:text-rose-600 transition-colors"
                title="Remove service"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="md" loading={isSaving} onClick={handleSave}>
          Save Catalogue Changes
        </Button>
      </div>
    </div>
  );
};
