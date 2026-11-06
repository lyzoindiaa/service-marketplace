import React, { useState } from 'react';
import { updateSellerCatalogue } from '../../services/sellerService';
import { ProviderServiceItem } from '../../services/providerService';
import { Button } from '../common/Button';
import { useUiStore } from '../../store/uiStore';

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
  };

  const handleSave = async () => {
    const validServices = services.filter(
      (s) => s.nameEn.trim().length > 0 && s.startingPrice > 0
    );

    if (validServices.length === 0) {
      addToast('Please provide at least 1 valid service with price', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateSellerCatalogue(validServices);
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
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Services & Rates Catalogue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prices shown on your public listing to customers across Ara.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleAdd}>
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
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Service Name (English)
              </label>
              <input
                type="text"
                value={srv.nameEn}
                onChange={(e) => handleChange(idx, 'nameEn', e.target.value)}
                placeholder="e.g. Ceiling Fan Bearing Change"
                className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-medium"
              />
            </div>

            <div className="w-full sm:w-36">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Starting Price (₹)
              </label>
              <input
                type="number"
                value={srv.startingPrice}
                onChange={(e) => handleChange(idx, 'startingPrice', e.target.value)}
                min={0}
                className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-medium"
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
