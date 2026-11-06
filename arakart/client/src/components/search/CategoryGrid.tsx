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
} from 'lucide-react';
import { fetchCategories, CategoryItem } from '../../services/discoveryService';
import { useUiStore } from '../../store/uiStore';

const getCategoryIcon = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    zap: <Zap className="w-6 h-6 text-amber-500" />,
    wrench: <Wrench className="w-6 h-6 text-blue-500" />,
    hammer: <Hammer className="w-6 h-6 text-amber-700" />,
    sparkles: <Sparkles className="w-6 h-6 text-indigo-500" />,
    scissors: <Scissors className="w-6 h-6 text-rose-500" />,
    car: <Car className="w-6 h-6 text-emerald-500" />,
    shield: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
    paintbrush: <Paintbrush className="w-6 h-6 text-purple-500" />,
    tv: <Tv className="w-6 h-6 text-teal-500" />,
    airvent: <AirVent className="w-6 h-6 text-cyan-500" />,
  };

  return iconMap[iconName.toLowerCase()] || <HelpCircle className="w-6 h-6 text-indigo-400" />;
};

export const CategoryGrid: React.FC = () => {
  const navigate = useNavigate();
  const language = useUiStore((s) => s.language);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          onClick={() => handleSelectCategory(cat.slug)}
          className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-50/50 flex items-center justify-center transition-colors mb-3">
            {getCategoryIcon(cat.icon)}
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
              {language === 'hi' ? cat.nameHi : cat.nameEn}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Explore specialists</p>
          </div>
        </button>
      ))}
    </div>
  );
};
