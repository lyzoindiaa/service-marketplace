import React from 'react';
import { ReviewItemData } from '../../services/reviewService';
import { StarRating } from '../common/StarRating';
import { useUiStore } from '../../store/uiStore';

export interface ReviewItemProps {
  review: ReviewItemData;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  const { language } = useUiStore();
  const initial = review.customerName ? review.customerName.charAt(0).toUpperCase() : 'C';

  const formattedDate = new Date(review.createdAt).toLocaleDateString(
    language === 'hi' ? 'hi-IN' : 'en-IN',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  return (
    <div className="py-5 border-b border-slate-100 last:border-b-0">
      {/* Header: Customer, Rating, Date */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
            {initial}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {review.customerName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-slate-400 font-medium">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Comment */}
      <p className="mt-3 text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
        {review.comment}
      </p>

      {/* Seller Reply Box (if any) */}
      {review.sellerReply && (
        <div className="mt-3.5 bg-slate-50/90 border-l-3 border-indigo-600 rounded-r-xl p-3.5 text-xs text-slate-700">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-indigo-700 flex items-center gap-1">
              <span>💬</span>
              {language === 'hi' ? 'प्रदाता का जवाब' : 'Response from owner'}
            </span>
            {review.sellerRepliedAt && (
              <span className="text-[11px] text-slate-400">
                {new Date(review.sellerRepliedAt).toLocaleDateString(
                  language === 'hi' ? 'hi-IN' : 'en-IN',
                  { month: 'short', day: 'numeric' }
                )}
              </span>
            )}
          </div>
          <p className="text-slate-600 leading-normal">{review.sellerReply}</p>
        </div>
      )}
    </div>
  );
};
