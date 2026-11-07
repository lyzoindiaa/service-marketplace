import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeller, ApplySellerPayload } from '../../services/sellerService';
import { fetchCategories, fetchCityAreas, CategoryItem } from '../../services/discoveryService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

export const SellerRegisterWizard: React.FC = () => {
  const { user, accessToken, setAuth } = useAuthStore();
  const { selectedCity, addToast, language } = useUiStore();

  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.phone || '');
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isRequestingCategory, setIsRequestingCategory] = useState(false);
  const [requestedCatNameEn, setRequestedCatNameEn] = useState('');
  const [requestedCatNameHi, setRequestedCatNameHi] = useState('');
  const [requestedCatDesc, setRequestedCatDesc] = useState('');
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
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.phone && !phone) {
      setPhone(user.phone);
      setWhatsapp(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, cityAreas] = await Promise.all([
          fetchCategories(),
          fetchCityAreas(selectedCity),
        ]);
        setCategories(cats);
        setAvailableAreas(
          cityAreas.areas?.length
            ? cityAreas.areas
            : ['Nawada', 'Anaith', 'Zero Mile', 'Gopali Chowk', 'Judge Bazar']
        );
      } catch (err) {
        console.error('Failed to load categories/areas', err);
      }
    };
    loadData();
  }, [selectedCity]);

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
    setFieldErrors({});

    if (step === 1) {
      const errors: Record<string, string> = {};
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanWhatsapp = whatsapp ? whatsapp.replace(/\D/g, '') : '';

      if (email.trim() && !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
      if (!phone || cleanPhone.length !== 10) {
        errors.phone = 'Please enter a valid 10-digit Indian mobile number';
      }
      if (whatsapp && cleanWhatsapp.length !== 10) {
        errors.whatsapp = 'Please enter a valid 10-digit WhatsApp number';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setErrorMessage(Object.values(errors)[0]);
        setTimeout(() => {
          const invalidIds: string[] = [];
          if (errors.email) invalidIds.push('seller-email');
          if (errors.phone) invalidIds.push('seller-phone');
          if (errors.whatsapp) invalidIds.push('seller-whatsapp');
          focusFirstInvalidField(invalidIds);
        }, 0);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const errors: Record<string, string> = {};
      if (!nameEn.trim() || nameEn.trim().length < 3) {
        errors.nameEn = 'Please enter your business or trade name (at least 3 characters)';
      }
      if (selectedCategories.length === 0) {
        if (!isRequestingCategory) {
          errors.categories = 'Please select at least 1 service category or propose a new trade';
        } else if (!requestedCatNameEn.trim() || requestedCatNameEn.trim().length < 2) {
          errors.requestedCatNameEn = 'Please enter the trade/category name (at least 2 characters)';
        }
      } else if (isRequestingCategory && (!requestedCatNameEn.trim() || requestedCatNameEn.trim().length < 2)) {
        errors.requestedCatNameEn = 'Please enter the trade/category name (at least 2 characters)';
      }
      if (!area) {
        errors.area = 'Please choose your primary locality';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setErrorMessage(Object.values(errors)[0]);
        setTimeout(() => {
          const invalidIds: string[] = [];
          if (errors.nameEn) invalidIds.push('business-name');
          if (errors.requestedCatNameEn) invalidIds.push('req-cat-name-en');
          if (errors.categories) invalidIds.push('seller-category-section');
          if (errors.area) invalidIds.push('primary-locality');
          focusFirstInvalidField(invalidIds);
        }, 0);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const errors: Record<string, string> = {};
      let firstInvalidId: string | null = null;

      services.forEach((srv, idx) => {
        if (!srv.nameEn.trim()) {
          errors[`service_name_${idx}`] = 'Service name is required';
          if (!firstInvalidId) firstInvalidId = `service-name-${idx}`;
        }
        if (!srv.startingPrice || srv.startingPrice <= 0) {
          errors[`service_price_${idx}`] = 'Starting price must be greater than 0';
          if (!firstInvalidId) firstInvalidId = `service-price-${idx}`;
        }
      });

      const validServices = services.filter((s) => s.nameEn.trim() && s.startingPrice > 0);
      if (validServices.length === 0 || Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setErrorMessage(Object.values(errors)[0] || 'Please provide at least 1 service with a valid starting price');
        if (firstInvalidId) {
          setTimeout(() => focusFirstInvalidField([firstInvalidId]), 0);
        }
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
      email: email.trim().toLowerCase(),
      categories: selectedCategories,
      requestedCategory:
        isRequestingCategory && requestedCatNameEn.trim()
          ? {
              nameEn: requestedCatNameEn.trim(),
              nameHi: requestedCatNameHi.trim() || undefined,
              description: requestedCatDesc.trim() || undefined,
            }
          : undefined,
      city: selectedCity,
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
      const createdProvider = await applySeller(payload);
      if (user && setAuth) {
        setAuth(
          {
            ...user,
            role: 'seller',
            sellerId: createdProvider?.id || (createdProvider as any)?._id || user.sellerId,
          },
          accessToken || ''
        );
      }
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
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Thank you for registering <strong className="text-slate-800">{nameEn}</strong>. Our
          verification team will review your application and approve your listing shortly.
        </p>

        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-left text-xs text-indigo-950 space-y-1.5 mb-6">
          <p className="font-bold flex items-center gap-1.5 text-indigo-900">
            <span>🔑</span> Your Login Credentials After Approval:
          </p>
          <p>
            Email: <strong className="text-indigo-950 font-mono">{email}</strong>
          </p>
          <p>
            Initial Password: <strong className="text-indigo-950 font-mono">Test@123</strong> (assigned automatically when admin approves your listing)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="md">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role === 'seller' || user?.sellerId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto mb-4">
          🏪
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {language === 'hi' ? 'आप पहले से एक विक्रेता हैं' : 'You are Already Registered'}
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {language === 'hi'
            ? 'आपका व्यवसाय AraKart पर पहले से पंजीकृत है। आप अपने डैशबोर्ड से ऑफर्स, कैटलॉग और लीड्स प्रबंधित कर सकते हैं।'
            : 'Your business account is already active on AraKart. You can manage your services, offers, and leads directly in your seller dashboard.'}
        </p>
        <Link to="/seller/dashboard">
          <Button variant="primary" size="md">
            {language === 'hi' ? 'विक्रेता डैशबोर्ड पर जाएं' : 'Go to Seller Dashboard'}
          </Button>
        </Link>
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
            Customers will contact you directly on these numbers.
          </p>

          <div>
            <label htmlFor="seller-email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address (Login ID) *
            </label>
            <Input
              id="seller-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="e.g. yourname@example.com"
              error={fieldErrors.email}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Once approved by admin, you will use this email with initial password <strong>Test@123</strong> to log into your seller dashboard.
            </p>
          </div>

          <div>
            <label htmlFor="seller-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Mobile Number (Calling) *
            </label>
            <Input
              id="seller-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
              }}
              placeholder="e.g. 9876543210"
              maxLength={10}
              error={fieldErrors.phone}
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
              onChange={(e) => {
                setWhatsapp(e.target.value);
                if (fieldErrors.whatsapp) setFieldErrors((prev) => ({ ...prev, whatsapp: '' }));
              }}
              placeholder="e.g. 9876543210"
              maxLength={10}
              error={fieldErrors.whatsapp}
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
              onChange={(e) => {
                setNameEn(e.target.value);
                if (fieldErrors.nameEn) setFieldErrors((prev) => ({ ...prev, nameEn: '' }));
              }}
              placeholder="e.g. Verma Electricals & Repair"
              error={fieldErrors.nameEn}
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
            <label htmlFor="seller-category-section" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Categories *
            </label>
            <div
              id="seller-category-section"
              tabIndex={-1}
              className={`flex flex-wrap gap-2 p-2 rounded-xl transition-all ${
                fieldErrors.categories ? 'ring-1 ring-red-500 bg-red-50/20' : ''
              }`}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.slug);
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => {
                      toggleCategory(cat.slug);
                      if (fieldErrors.categories) {
                        setFieldErrors((prev) => ({ ...prev, categories: '' }));
                      }
                    }}
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
            {fieldErrors.categories && (
              <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.categories}</p>
            )}

            {/* Propose a new category section */}
            <div className="mt-3">
              {!isRequestingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsRequestingCategory(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/60 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <span>✨ Can't find your trade? Propose a new category</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <span>✨ Propose a New Category</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRequestingCategory(false);
                        setRequestedCatNameEn('');
                        setRequestedCatNameHi('');
                        setRequestedCatDesc('');
                        if (fieldErrors.requestedCatNameEn) {
                          setFieldErrors((prev) => ({ ...prev, requestedCatNameEn: '' }));
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    If AraKart does not list your specific trade yet, enter it below. Our admin team will create and approve your category during onboarding!
                  </p>

                  <div>
                    <label htmlFor="req-cat-name-en" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Category / Trade Name (English) *
                    </label>
                    <Input
                      id="req-cat-name-en"
                      type="text"
                      value={requestedCatNameEn}
                      onChange={(e) => {
                        setRequestedCatNameEn(e.target.value);
                        if (fieldErrors.requestedCatNameEn) {
                          setFieldErrors((prev) => ({ ...prev, requestedCatNameEn: '' }));
                        }
                      }}
                      placeholder="e.g. CCTV Camera Installation & Maintenance"
                      error={fieldErrors.requestedCatNameEn}
                    />
                  </div>

                  <div>
                    <label htmlFor="req-cat-name-hi" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Category Name (Hindi - Optional)
                    </label>
                    <Input
                      id="req-cat-name-hi"
                      type="text"
                      value={requestedCatNameHi}
                      onChange={(e) => setRequestedCatNameHi(e.target.value)}
                      placeholder="e.g. सीसीटीवी कैमरा इंस्टॉलेशन और सर्विसिंग"
                    />
                  </div>

                  <div>
                    <label htmlFor="req-cat-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Brief Description (Optional)
                    </label>
                    <Input
                      id="req-cat-desc"
                      type="text"
                      value={requestedCatDesc}
                      onChange={(e) => setRequestedCatDesc(e.target.value)}
                      placeholder="e.g. Security camera installation, wiring, and DVR maintenance"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="primary-locality" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Primary Locality *
              </label>
              <select
                id="primary-locality"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setAreasServed([e.target.value]);
                  if (fieldErrors.area) setFieldErrors((prev) => ({ ...prev, area: '' }));
                }}
                className={`w-full text-sm rounded-xl border p-2.5 font-medium transition-colors ${
                  fieldErrors.area
                    ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                    : 'border-slate-200 bg-slate-50'
                }`}
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
              placeholder="Tell customers about your specialties, tools, and experience..."
              className="w-full text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium resize-none"
            />
          </div>
        </div>
      )}

      {/* STEP 3: CATALOGUE */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Services & Rates</h3>
              <p className="text-xs text-slate-500">
                Add standard starting prices for your services.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleAddService}
            >
              + Add Service
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {services.map((srv, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  id={`service-name-${idx}`}
                  type="text"
                  value={srv.nameEn}
                  onChange={(e) => {
                    handleServiceChange(idx, 'nameEn', e.target.value);
                    if (fieldErrors[`service_name_${idx}`]) {
                      setFieldErrors((prev) => ({ ...prev, [`service_name_${idx}`]: '' }));
                    }
                  }}
                  placeholder="e.g. Fan Repair / Switchboard Fix"
                  className={`flex-1 text-sm rounded-xl border p-2.5 font-medium transition-colors ${
                    fieldErrors[`service_name_${idx}`]
                      ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <div className="relative w-full sm:w-32">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <input
                    id={`service-price-${idx}`}
                    type="number"
                    value={srv.startingPrice}
                    onChange={(e) => {
                      handleServiceChange(idx, 'startingPrice', e.target.value);
                      if (fieldErrors[`service_price_${idx}`]) {
                        setFieldErrors((prev) => ({ ...prev, [`service_price_${idx}`]: '' }));
                      }
                    }}
                    placeholder="Price"
                    min={0}
                    className={`w-full text-sm rounded-xl border pl-7 pr-2.5 py-2.5 font-medium transition-colors ${
                      fieldErrors[`service_price_${idx}`]
                        ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                        : 'border-slate-200 bg-slate-50'
                    }`}
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
              <span className="font-bold text-indigo-700 capitalize text-right">
                {selectedCategories.length > 0
                  ? selectedCategories.join(', ')
                  : isRequestingCategory && requestedCatNameEn
                  ? `Proposed: ${requestedCatNameEn}`
                  : 'None selected'}
                {selectedCategories.length > 0 && isRequestingCategory && requestedCatNameEn && (
                  <span className="block text-[11px] text-amber-700 font-medium mt-0.5">
                    + Proposing new: {requestedCatNameEn}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Primary Locality:</span>
              <span className="font-bold text-slate-900">{area}</span>
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
            size="md"
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
            size="md"
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
