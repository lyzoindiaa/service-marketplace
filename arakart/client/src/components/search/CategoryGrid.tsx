import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Wrench,
  Hammer,
  Sparkles,
  Scissors,
  Car,
  ShieldCheck,
  Paintbrush,
  Tv,
  AirVent,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchCategories, CategoryItem } from '../../services/discoveryService';
import { useUiStore } from '../../store/uiStore';

const getCategoryIcon = (iconName: string, slug?: string) => {
  const key = (slug || iconName || '').toLowerCase().trim();
  const iconMap: Record<string, React.ReactNode> = {
    zap: <Zap className="w-6 h-6 text-amber-500" />,
    electrician: <Zap className="w-6 h-6 text-amber-500" />,
    wrench: <Wrench className="w-6 h-6 text-blue-500" />,
    plumber: <Wrench className="w-6 h-6 text-blue-500" />,
    mechanic: <Wrench className="w-6 h-6 text-indigo-600" />,
    hammer: <Hammer className="w-6 h-6 text-amber-700" />,
    carpenter: <Hammer className="w-6 h-6 text-amber-700" />,
    sparkles: <Sparkles className="w-6 h-6 text-indigo-500" />,
    cleaning: <Sparkles className="w-6 h-6 text-emerald-500" />,
    scissors: <Scissors className="w-6 h-6 text-rose-500" />,
    salon: <Scissors className="w-6 h-6 text-rose-500" />,
    car: <Car className="w-6 h-6 text-emerald-500" />,
    cab: <Car className="w-6 h-6 text-emerald-500" />,
    shield: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
    paintbrush: <Paintbrush className="w-6 h-6 text-purple-500" />,
    painter: <Paintbrush className="w-6 h-6 text-purple-500" />,
    tv: <Tv className="w-6 h-6 text-teal-500" />,
    airvent: <AirVent className="w-6 h-6 text-cyan-500" />,
    ac: <AirVent className="w-6 h-6 text-cyan-500" />,
    'ac-repair': <AirVent className="w-6 h-6 text-cyan-500" />,
  };

  if (iconMap[key]) {
    return iconMap[key];
  }
  if (iconMap[(iconName || '').toLowerCase()]) {
    return iconMap[(iconName || '').toLowerCase()];
  }
  // If iconName is an emoji (non-ASCII character like 🔧, ❄️, 🚕), render it directly
  if (iconName && /[^\u0000-\u007f]/.test(iconName)) {
    return <span className="text-2xl leading-none">{iconName}</span>;
  }

  return <HelpCircle className="w-6 h-6 text-indigo-400" />;
};

export const CategoryGrid: React.FC = () => {
  const navigate = useNavigate();
  const language = useUiStore((s) => s.language);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnIndex, setColumnIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchCategories()
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCategory = (slug: string) => {
    navigate(`/search?category=${slug}`);
  };

  // Group categories into vertical 2-row columns when more than 8 exist so there are strictly 2 lines
  const isTwoLineCarousel = categories.length > 8;
  const columns: CategoryItem[][] = [];
  if (isTwoLineCarousel) {
    for (let i = 0; i < categories.length; i += 2) {
      const pair = [categories[i]];
      if (i + 1 < categories.length) {
        pair.push(categories[i + 1]);
      } else if (categories.length > 0) {
        // Balance the second row on odd counts so both lines stay complete
        pair.push(categories[0]);
      }
      columns.push(pair);
    }
  }

  const totalColumns = columns.length;

  useEffect(() => {
    if (!isTwoLineCarousel || totalColumns <= 4 || isPaused) return;

    const timer = setInterval(() => {
      setColumnIndex((prev) => (prev + 1) % totalColumns);
    }, 3000);

    return () => clearInterval(timer);
  }, [isTwoLineCarousel, totalColumns, isPaused]);

  const handlePrevColumn = () => {
    if (totalColumns <= 1) return;
    setColumnIndex((prev) => (prev - 1 + totalColumns) % totalColumns);
  };

  const handleNextColumn = () => {
    if (totalColumns <= 1) return;
    setColumnIndex((prev) => (prev + 1) % totalColumns);
  };

  const renderCategoryCard = (cat: CategoryItem, keySuffix = '') => (
    <button
      key={`${cat.slug}${keySuffix}`}
      type="button"
      onClick={() => handleSelectCategory(cat.slug)}
      className="group p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center text-center w-full"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-50/50 flex items-center justify-center transition-colors mb-3 mx-auto">
        {getCategoryIcon(cat.icon, cat.slug)}
      </div>
      <div className="w-full">
        <h4 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
          {language === 'hi' ? cat.nameHi : cat.nameEn}
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">
          {language === 'hi' ? 'विशेषज्ञ देखें' : 'Explore specialists'}
        </p>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-slate-100 rounded-2xl animate-pulse border border-slate-200"
          />
        ))}
      </div>
    );
  }

  // Standard 2-line grid when 8 or fewer categories exist
  if (!isTwoLineCarousel) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 w-full">
        {categories.map((cat) => renderCategoryCard(cat))}
      </div>
    );
  }

  // Auto-moving 2-line carousel when more than 8 categories exist
  const trackColumns = [...columns, ...columns.slice(0, 4)];

  return (
    <div
      className="w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden -mx-1.5 sm:-mx-2 px-1.5 sm:px-2 py-1">
        <div
          className="flex transition-transform duration-700 ease-in-out [--cat-slide-step:50%] sm:[--cat-slide-step:33.333333%] md:[--cat-slide-step:25%]"
          style={{
            transform: `translateX(calc(-${columnIndex} * var(--cat-slide-step)))`,
          }}
        >
          {trackColumns.map((colPair, colIdx) => (
            <div
              key={`cat-col-${colIdx}`}
              className="w-1/2 sm:w-1/3 md:w-1/4 shrink-0 px-1.5 sm:px-2 flex flex-col gap-3 sm:gap-4"
            >
              {colPair.map((cat, rowIdx) =>
                renderCategoryCard(cat, `-${colIdx}-${rowIdx}`)
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Carousel Controls & Pagination Dots */}
      <div className="flex items-center justify-between mt-5">
        <div className="flex items-center gap-1.5">
          {columns.map((_, idx) => {
            const isActive = idx === columnIndex;
            return (
              <button
                key={`cat-dot-${idx}`}
                type="button"
                onClick={() => setColumnIndex(idx)}
                aria-label={`Go to category slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 bg-indigo-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevColumn}
            aria-label="Previous categories"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-center shadow-xs transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextColumn}
            aria-label="Next categories"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-center shadow-xs transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
