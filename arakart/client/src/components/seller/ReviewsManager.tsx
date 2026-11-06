import React, { useState } from 'react';
import { replyToReview, ReviewItemData } from '../../services/reviewService';
import { StarRating } from '../common/StarRating';
import { Button } from '../common/Button';
import { useUiStore } from '../../store/uiStore';

export interface ReviewsManagerProps {
  reviews: ReviewItemData[];
  onReplyAdded: (reviewId: string, reply: string) => void;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  reviews,
  onReplyAdded,
}) => {
  const { addToast } = useUiStore();
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleReplySubmit = async (reviewId: string) => {
    const text = replyTextMap[reviewId]?.trim();
    if (!text || text.length < 2) {
      addToast('Please enter a response with at least 2 characters', 'error');
      return;
    }

    setSubmittingId(reviewId);
    try {
      await replyToReview(reviewId, text);
      onReplyAdded(reviewId, text);
      addToast('Reply posted successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to post reply', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <span className="text-4xl mb-3 block">⭐</span>
        <h3 className="text-base font-bold text-slate-900 mb-1">No Reviews Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Reviews from customers you have served in Ara will appear here. You can respond directly to thank them or provide follow-up assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          Customer Reviews ({reviews.length})
        </h3>
        <span className="text-xs text-slate-400">Feedback from verified customers</span>
      </div>

      <div className="divide-y divide-slate-100 space-y-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="pt-4 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">{rev.customerName}</span>
              <span className="text-xs text-slate-400">
                {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="mt-1">
              <StarRating rating={rev.rating} size="sm" />
            </div>

            <p className="text-xs text-slate-700 mt-2 font-normal whitespace-pre-line leading-relaxed">
              {rev.comment}
            </p>

            {/* Seller reply or reply form */}
            {rev.sellerReply ? (
              <div className="mt-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs">
                <span className="font-bold text-indigo-700 block mb-1">
                  Your Response:
                </span>
                <p className="text-slate-700">{rev.sellerReply}</p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={replyTextMap[rev.id] || ''}
                  onChange={(e) =>
                    setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })
                  }
                  placeholder="Write a response to this customer..."
                  className="flex-1 text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium"
                />
                <Button
                  size="sm"
                  variant="primary"
                  loading={submittingId === rev.id}
                  onClick={() => handleReplySubmit(rev.id)}
                >
                  Reply
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
