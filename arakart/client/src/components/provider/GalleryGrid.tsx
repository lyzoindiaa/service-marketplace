import React, { useState } from 'react';
import { Modal } from '../common/Modal';

export interface GalleryGridProps {
  photos: string[];
  providerName: string;
  className?: string;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  photos,
  providerName,
  className = '',
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <div className={`mt-6 ${className}`}>
      <h3 className="text-base font-bold text-slate-900 mb-3">Work & Shop Photos</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            className="group relative overflow-hidden rounded-xl border border-slate-200/80 aspect-4/3 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <img
              src={photo}
              alt={`${providerName} photo ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
              🔍 View
            </div>
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <Modal
          isOpen={Boolean(selectedPhoto)}
          onClose={() => setSelectedPhoto(null)}
          title={`${providerName} - Photo`}
        >
          <div className="flex items-center justify-center p-2">
            <img
              src={selectedPhoto}
              alt="Enlarged preview"
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-lg"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
