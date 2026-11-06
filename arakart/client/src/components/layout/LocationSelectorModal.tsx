import React, { useEffect, useState } from 'react';
import { MapPin, CheckCircle2, Clock, Globe } from 'lucide-react';
import { Modal } from '../common/Modal';
import { fetchCities, CityItem } from '../../services/discoveryService';
import { useUiStore } from '../../store/uiStore';

const FALLBACK_CITIES: CityItem[] = [
  {
    id: 'delhi',
    slug: 'delhi',
    nameEn: 'New Delhi',
    nameHi: 'नई दिल्ली',
    stateEn: 'Delhi NCR',
    stateHi: 'दिल्ली एनसीआर',
    isLive: true,
  },
  {
    id: 'mumbai',
    slug: 'mumbai',
    nameEn: 'Mumbai',
    nameHi: 'मुंबई',
    stateEn: 'Maharashtra',
    stateHi: 'महाराष्ट्र',
    isLive: true,
  },
  {
    id: 'bengaluru',
    slug: 'bengaluru',
    nameEn: 'Bengaluru',
    nameHi: 'बेंगलुरु',
    stateEn: 'Karnataka',
    stateHi: 'कर्नाटक',
    isLive: true,
  },
  {
    id: 'lucknow',
    slug: 'lucknow',
    nameEn: 'Lucknow',
    nameHi: 'लखनऊ',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    isLive: true,
  },
];

export const LocationSelectorModal: React.FC = () => {
  const {
    cityModalOpen,
    closeCityModal,
    selectedCity,
    setCityDetails,
    language,
    addToast,
  } = useUiStore();
  const [cities, setCities] = useState<CityItem[]>(FALLBACK_CITIES);

  useEffect(() => {
    if (!cityModalOpen) return;
    fetchCities()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const filtered = data.filter((c) => c.slug?.toLowerCase() !== 'ara');
          if (filtered.length > 0) {
            setCities(filtered);
          }
        }
      })
      .catch(() => {});
  }, [cityModalOpen]);

  // Group cities by State
  const groupedByState = cities.reduce<Record<string, CityItem[]>>((acc, city) => {
    const stateKey =
      language === 'hi' ? city.stateHi || city.stateEn || 'भारत' : city.stateEn || 'India';
    if (!acc[stateKey]) {
      acc[stateKey] = [];
    }
    acc[stateKey].push(city);
    return acc;
  }, {});

  const handleSelectAllCities = () => {
    setCityDetails({
      slug: 'all',
      nameEn: 'All Cities',
      nameHi: 'सभी शहर',
      stateEn: 'India',
      stateHi: 'भारत',
    });
    addToast(
      language === 'hi' ? 'सभी शहरों की सेवाएं दिखाई जा रही हैं' : 'Showing services across all cities',
      'success'
    );
  };

  const handleSelectCity = (city: CityItem) => {
    if (!city.isLive) {
      addToast(
        language === 'hi'
          ? `${city.nameHi || city.nameEn} में सेवाएं जल्द ही शुरू हो रही हैं!`
          : `Services in ${city.nameEn} are launching soon!`,
        'info'
      );
      return;
    }

    setCityDetails({
      slug: city.slug,
      nameEn: city.nameEn,
      nameHi: city.nameHi,
      stateEn: city.stateEn || 'India',
      stateHi: city.stateHi || 'भारत',
    });

    addToast(
      language === 'hi'
        ? `आपका शहर अब ${city.nameHi || city.nameEn} चुना गया है`
        : `Switched location to ${city.nameEn}, ${city.stateEn || 'India'}`,
      'success'
    );
  };

  return (
    <Modal
      isOpen={cityModalOpen}
      onClose={closeCityModal}
      title={language === 'hi' ? 'अपना राज्य और शहर चुनें' : 'Select Your State & City'}
      maxWidth="md"
    >
      <div className="space-y-5">
        <p className="text-xs sm:text-sm text-slate-600">
          {language === 'hi'
            ? 'अपने शहर के सत्यापित स्थानीय सेवा प्रदाताओं और ऑफ़र देखने के लिए अपना स्थान चुनें।'
            : 'Choose your city or state to discover verified local service professionals, prices, and offers.'}
        </p>

        {/* All Cities Option */}
        <button
          type="button"
          onClick={handleSelectAllCities}
          className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
            selectedCity === 'all' || !selectedCity
              ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="font-bold text-sm text-slate-900">
                {language === 'hi' ? 'सभी शहर (अखिल भारतीय)' : 'All Cities (Pan-India)'}
              </div>
              <div className="text-[11px] text-slate-500">
                {language === 'hi'
                  ? 'सभी राज्यों और शहरों के सेवा प्रदाता देखें'
                  : 'Browse service providers across all states & cities'}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>{selectedCity === 'all' || !selectedCity ? 'Active' : 'Select'}</span>
          </span>
        </button>

        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {Object.entries(groupedByState).map(([stateLabel, stateCities]) => (
            <div key={stateLabel} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>{stateLabel}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {stateCities.map((city) => {
                  const isSelected = selectedCity.toLowerCase() === city.slug.toLowerCase();
                  const displayName =
                    language === 'hi' ? city.nameHi || city.nameEn : city.nameEn;

                  return (
                    <button
                      key={city.slug}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                          : city.isLive
                          ? 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white'
                          : 'border-slate-100 bg-slate-50/60 opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{displayName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{stateLabel}</div>
                      </div>

                      {city.isLive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isSelected ? (language === 'hi' ? 'चयनित' : 'Active') : 'Live'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>{language === 'hi' ? 'जल्द आ रहा है' : 'Soon'}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
