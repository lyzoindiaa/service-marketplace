import React, { useState } from 'react';
import { updateSellerProfile } from '../../services/sellerService';
import { ProviderProfile } from '../../services/providerService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUiStore } from '../../store/uiStore';

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
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '');
  const [bioEn, setBioEn] = useState(profile.bioEn || '');
  const [experience, setExperience] = useState(profile.experience || 0);
  const [workingHours, setWorkingHours] = useState(profile.workingHours || '');
  const [isAllDay, setIsAllDay] = useState(profile.isAllDay || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateSellerProfile({
        nameEn,
        area,
        whatsapp,
        bioEn,
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
          onChange={(e) => setNameEn(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-area" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Primary Area in Ara
          </label>
          <Input
            id="edit-area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="edit-whatsapp" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            WhatsApp Number
          </label>
          <Input
            id="edit-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
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

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="md" loading={isSaving} type="submit">
          Save Profile Changes
        </Button>
      </div>
    </form>
  );
};
