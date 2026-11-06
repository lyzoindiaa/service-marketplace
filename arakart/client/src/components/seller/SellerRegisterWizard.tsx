import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeller, ApplySellerPayload } from '../../services/sellerService';
import { fetchCategories, fetchCityAreas, CategoryItem } from '../../services/discoveryService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';

export const SellerRegisterWizard: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();

  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.phone || '');
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [area, setArea] = useState('Nawada');
  const [areasServed, setAreasServed] = useState<string[]>(['Nawada']);
  const [experience, setExperience] = useState<number>(3);
  const [bioEn, setBioEn] = useState('');
  const [workingHours, setWorkingHours] = useState('8:00 AM - 8:00 PM');
  const [isAllDay, setIsAllDay] = useState(false);
  const [services, setServices] = useState<Array<{ nameEn: string; startingPrice: number }>>([
    { nameEn: '', startingPrice: 150 },
  ]);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
      setWhatsapp(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, cityAreas] = await Promise.all([
          fetchCategories(),
          fetchCityAreas('ara'),
        ]);
        setCategories(cats);
        setAvailableAreas(cityAreas.areas || ['Nawada', 'Anaith', 'Zero Mile', 'Gopali Chowk', 'Judge Bazar']);
      } catch (err) {
        console.error('Failed to load categories/areas', err);
      }
    };
    loadData();
  }, []);

  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== slug));
    } else {
      setSelectedCategories([...selectedCategories, slug]);
    }
  };

  const handleAddService = () => {
    setServices([...services, { nameEn: '', startingPrice: 200 }]);
  };

  const handleRemoveService = (index: number) => {
    if (services.length <= 1) return;
    setServices(services.filter((_, idx) => idx !== index));
  };

  const handleServiceChange = (index: number, field: 'nameEn' | 'startingPrice', val: any) => {
    const updated = [...services];
    updated[index] = {
      ...updated[index],
      [field]: field === 'startingPrice' ? Number(val) || 0 : val,
    };
    setServices(updated);
  };

  const handleNext = () => {
    setErrorMessage(null);

    if (step === 1) {
      if (!phone || phone.replace(/\D/g, '').length !== 10) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!nameEn.trim() || nameEn.trim().length < 3) {
        setErrorMessage('Please enter your business or trade name (at least 3 characters)');
        return;
      }
      if (selectedCategories.length === 0) {
        setErrorMessage('Please select at least 1 service category');
        return;
      }
      if (!area) {
        setErrorMessage('Please choose your primary Ara locality');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const validServices = services.filter((s) => s.nameEn.trim() && s.startingPrice > 0);
      if (validServices.length === 0) {
        setErrorMessage('Please provide at least 1 service with a valid starting price');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const payload: ApplySellerPayload = {
      nameEn: nameEn.trim(),
      nameHi: nameHi.trim() || undefined,
      categories: selectedCategories,
      area,
      areasServed: areasServed.length > 0 ? areasServed : [area],
      phone: phone.replace(/\D/g, ''),
      whatsapp: whatsapp ? whatsapp.replace(/\D/g, '') : undefined,
      bioEn: bioEn.trim() || undefined,
      experience: Number(experience) || 0,
      workingHours: isAllDay ? '24/7 Available' : workingHours,
      isAllDay,
      services: services.filter((s) => s.nameEn.trim()),
    };

    try {
      await applySeller(payload);
      setIsSubmitted(true);
      addToast('Application submitted successfully!', 'success');
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to submit seller application'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <Badge variant="pending" className="mb-3 text-xs py-1 px-3">
          Under Review by AraKart Admin
        </Badge>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Application Submitted!
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Thank you for registering <strong className="text-slate-800">{nameEn}</strong>. Our
          local Ara verification team will verify your details and approve your listing shortly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/seller/dashboard">
            <Button variant="primary" size="md">
              Go to Seller Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="md">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-2xl mx-auto my-6">
      {/* Stepper Header */}
      <div className="mb-6 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
          <span>Step {step} of 4</span>
          <span>
            {step === 1 && 'Contact Verification'}
            {step === 2 && 'Business Details'}
            {step === 3 && 'Services Catalogue'}
            {step === 4 && 'Review & Submit'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2">
          <span className="shrink-0 text-sm">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: CONTACT */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Contact Information</h3>
          <p className="text-xs text-slate-500">
            Customers in Ara will contact you directly on these numbers.
          </p>

          <div>
            <label htmlFor="seller-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Mobile Number (Calling) *
            </label>
            <Input
              id="seller-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              maxLength={10}
            />
          </div>

          <div>
            <label htmlFor="seller-whatsapp" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              WhatsApp Number (Optional)
            </label>
            <Input
              id="seller-whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. 9876543210"
              maxLength={10}
            />
          </div>
        </div>
      )}

      {/* STEP 2: BUSINESS INFO */}
      {step === 2 && (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-slate-900">Business & Service Details</h3>

          <div>
            <label htmlFor="business-name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Business Name (English) *
            </label>
            <Input
              id="business-name"
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Verma Electricals & Repair"
            />
          </div>

          <div>
            <label htmlFor="business-name-hi" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Business Name (Hindi - Optional)
            </label>
            <Input
              id="business-name-hi"
              type="text"
              value={nameHi}
              onChange={(e) => setNameHi(e.target.value)}
              placeholder="e.g. वर्मा इलेक्ट्रिकल & रिपेयर"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Categories *
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.slug);
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="primary-locality" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Primary Locality (Ara) *
              </label>
              <select
                id="primary-locality"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setAreasServed([e.target.value]);
                }}
                className="w-full text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium"
              >
                {availableAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="experience-years" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Years of Experience
              </label>
              <Input
                id="experience-years"
                type="number"
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
                min={0}
                max={50}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="working-hours" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
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
            {!isAllDay && (
              <Input
                id="working-hours"
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="e.g. 8:00 AM - 8:00 PM"
              />
            )}
          </div>

          <div>
            <label htmlFor="seller-bio" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              About Your Services & Skills (Optional)
            </label>
            <textarea
              id="seller-bio"
              rows={2}
              value={bioEn}
              onChange={(e) => setBioEn(e.target.value)}
              placeholder="Tell customers about your specialties, tools, and experience in Ara..."
              className="w-full text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium resize-none"
            />
          </div>
        </div>
      )}

      {/* STEP 3: CATALOGUE */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Services & Rates</h3>
              <p className="text-xs text-slate-500">
                Add standard starting prices for your services.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddService}
            >
              + Add Service
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {services.map((srv, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={srv.nameEn}
                  onChange={(e) => handleServiceChange(idx, 'nameEn', e.target.value)}
                  placeholder="e.g. Fan Repair / Switchboard Fix"
                  className="flex-1 text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium"
                />
                <div className="relative w-32">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={srv.startingPrice}
                    onChange={(e) => handleServiceChange(idx, 'startingPrice', e.target.value)}
                    placeholder="Price"
                    min={0}
                    className="w-full text-sm rounded-xl border border-slate-200 pl-7 pr-2.5 py-2.5 bg-slate-50 font-medium"
                  />
                </div>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveService(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    aria-label="Remove service"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {step === 4 && (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-slate-900">Review Your Application</h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Business Name:</span>
              <span className="font-bold text-slate-900">{nameEn}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Categories:</span>
              <span className="font-bold text-indigo-700 capitalize">
                {selectedCategories.join(', ')}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Primary Locality:</span>
              <span className="font-bold text-slate-900">{area}, Ara</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Phone:</span>
              <span className="font-bold text-slate-900">{phone}</span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 font-semibold block mb-1">
                Catalogue Services ({services.length}):
              </span>
              <div className="space-y-1">
                {services.map((s, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{s.nameEn}</span>
                    <span className="font-bold text-indigo-600">₹{s.startingPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
        ) : (
          <div></div>
        )}

        {step < 4 ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleNext}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
};
