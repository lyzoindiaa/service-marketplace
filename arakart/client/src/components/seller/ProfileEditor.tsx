import React, { useState, useRef, useEffect } from 'react';
import {
  updateSellerProfile,
  uploadSellerPhoto,
  deleteSellerPhoto,
} from '../../services/sellerService';
import { ProviderProfile } from '../../services/providerService';
import { fetchCategories, CategoryItem } from '../../services/discoveryService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUiStore } from '../../store/uiStore';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

export interface ProfileEditorProps {
  profile: ProviderProfile;
  onProfileUpdated: (updated: ProviderProfile) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onProfileUpdated,
}) => {
  const { addToast } = useUiStore();

  const [nameEn, setNameEn] = useState(profile.nameEn || '');
  const [area, setArea] = useState(profile.area || '');
  const [categories, setCategories] = useState<string[]>(profile.categories || []);
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '');
  const [bioEn, setBioEn] = useState(profile.bioEn || '');
  const [experience, setExperience] = useState(profile.experience || 0);
  const [workingHours, setWorkingHours] = useState(profile.workingHours || '');
  const [isAllDay, setIsAllDay] = useState(profile.isAllDay || false);
  const [photos, setPhotos] = useState<string[]>(profile.photos || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories().then(setAvailableCategories).catch(() => {});
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 6) {
      addToast('Maximum 6 photos allowed. Please delete a photo before uploading a new one.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('File size too large. Maximum size is 2MB.', 'error');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast('Unsupported file type. Only JPEG, PNG, and WebP are allowed.', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await uploadSellerPhoto(file);
      setPhotos(res.photos);
      onProfileUpdated({ ...profile, photos: res.photos });
      addToast('Photo uploaded successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      const res = await deleteSellerPhoto(photoUrl);
      setPhotos(res.photos);
      onProfileUpdated({ ...profile, photos: res.photos });
      addToast('Photo deleted successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to delete photo', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!nameEn.trim() || nameEn.trim().length < 3) {
      errors.nameEn = 'Business name must be at least 3 characters';
    }
    if (!area.trim() || area.trim().length < 2) {
      errors.area = 'Primary area is required (at least 2 characters)';
    }
    if (categories.length === 0) {
      errors.categories = 'Please select at least 1 service category';
    }
    if (whatsapp.trim()) {
      const cleanWhatsapp = whatsapp.replace(/\D/g, '');
      if (cleanWhatsapp.length !== 10) {
        errors.whatsapp = 'Please enter a valid 10-digit WhatsApp number';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const invalidIds: string[] = [];
      if (errors.nameEn) invalidIds.push('edit-name');
      if (errors.area) invalidIds.push('edit-area');
      if (errors.whatsapp) invalidIds.push('edit-whatsapp');
      setTimeout(() => focusFirstInvalidField(invalidIds), 0);
      addToast(Object.values(errors)[0], 'error');
      return;
    }

    setFieldErrors({});
    setIsSaving(true);
    try {
      const updated = await updateSellerProfile({
        nameEn: nameEn.trim(),
        area: area.trim(),
        categories,
        whatsapp: whatsapp ? whatsapp.replace(/\D/g, '') : '',
        bioEn: bioEn.trim(),
        experience,
        workingHours,
        isAllDay,
      });
      onProfileUpdated(updated);
      addToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5"
    >
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Edit Business Profile</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Update your public profile, business hours, and contact numbers.
        </p>
      </div>

      <div>
        <label htmlFor="edit-name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          Business Name
        </label>
        <Input
          id="edit-name"
          value={nameEn}
          onChange={(e) => {
            setNameEn(e.target.value);
            if (fieldErrors.nameEn) setFieldErrors((prev) => ({ ...prev, nameEn: '' }));
          }}
          error={fieldErrors.nameEn}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-area" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Primary Area / Locality
          </label>
          <Input
            id="edit-area"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              if (fieldErrors.area) setFieldErrors((prev) => ({ ...prev, area: '' }));
            }}
            error={fieldErrors.area}
          />
        </div>

        <div>
          <label htmlFor="edit-whatsapp" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            WhatsApp Number
          </label>
          <Input
            id="edit-whatsapp"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              if (fieldErrors.whatsapp) setFieldErrors((prev) => ({ ...prev, whatsapp: '' }));
            }}
            error={fieldErrors.whatsapp}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          Service Categories
        </label>
        <p className="text-xs text-slate-500 mb-2.5">
          Select all categories of services you provide so customers can discover you.
        </p>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((cat) => {
            const isSelected = categories.includes(cat.slug);
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    if (categories.length > 1) {
                      setCategories(categories.filter((c) => c !== cat.slug));
                    } else {
                      addToast('At least 1 category is required', 'error');
                    }
                  } else {
                    setCategories([...categories, cat.slug]);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>{cat.nameEn}</span>
                {isSelected && <span className="text-indigo-600 font-bold ml-0.5">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="edit-hours" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Working Hours
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>24/7 Available</span>
            </label>
          </div>
          <Input
            id="edit-hours"
            value={isAllDay ? '24/7 Available' : workingHours}
            disabled={isAllDay}
            onChange={(e) => setWorkingHours(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="edit-exp" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Years of Experience
          </label>
          <Input
            id="edit-exp"
            type="number"
            value={experience}
            onChange={(e) => setExperience(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-bio" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          About / Bio Description
        </label>
        <textarea
          id="edit-bio"
          rows={3}
          value={bioEn}
          onChange={(e) => setBioEn(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium resize-none"
        />
      </div>

      {/* Shop & Work Photos (INT-005) */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Work & Shop Photos ({photos.length}/6)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upload photos of your storefront, equipment, or recent service work (Max 2MB each, JPEG/PNG/WebP).
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={photos.length >= 6 || isUploadingPhoto}
            loading={isUploadingPhoto}
            onClick={() => fileInputRef.current?.click()}
          >
            + Upload Photo
          </Button>
        </div>

        {photos.length === 0 ? (
          <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
            No photos uploaded yet. Adding shop photos helps customers trust your services!
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {photos.map((url, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100 shadow-xs"
              >
                <img
                  src={url}
                  alt={`Shop photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(url)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="md" loading={isSaving} type="submit">
          Save Profile Changes
        </Button>
      </div>
    </form>
  );
};
