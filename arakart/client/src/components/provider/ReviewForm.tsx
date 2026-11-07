import React, { useState } from 'react';
import { submitReview, ReviewItemData } from '../../services/reviewService';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

export interface ReviewFormProps {
  providerId: string;
  onReviewSubmitted: (review: ReviewItemData) => void;
  className?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  providerId,
  onReviewSubmitted,
  className = '',
}) => {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal, addToast, language } = useUiStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className={`p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center ${className}`}>
        <h3 className="text-base font-bold text-slate-900 mb-1.5">
          {language === 'hi' ? 'समीक्षा लिखने के लिए लॉगिन करें' : 'Login to leave a review'}
        </h3>
        <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
          {language === 'hi'
            ? 'केवल सत्यापित ग्राहक ही आराकार्ट पर स्थानीय प्रदाताओं की समीक्षा लिख सकते हैं।'
            : 'Only verified customers can share ratings & reviews to help fellow residents.'}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={openAuthModal}
        >
          {language === 'hi' ? 'लॉगिन करें' : 'Login to Review'}
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCommentError(false);

    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5');
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      setCommentError(true);
      setErrorMessage('Review comment must be at least 3 characters');
      setTimeout(() => focusFirstInvalidField(['review-comment']), 0);
      return;
    }

    setIsSubmitting(true);
    try {
      const createdReview = await submitReview({
        providerId,
        rating,
        comment: comment.trim(),
      });

      addToast(
        language === 'hi'
          ? 'आपकी समीक्षा सफलतापूर्वक सबमिट हो गई है!'
          : 'Thank you! Your review has been submitted.',
        'success'
      );
      setComment('');
      setRating(5);
      onReviewSubmitted(createdReview);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to submit review';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStarDisplay = hoverRating !== null ? hoverRating : rating;

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs ${className}`}
    >
      <h3 className="text-base font-bold text-slate-900 mb-4">
        {language === 'hi' ? 'समीक्षा लिखें' : 'Write a Review'}
      </h3>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2">
          <span className="shrink-0 text-sm">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Star Picker */}
      <div className="mb-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          {language === 'hi' ? 'आपकी रेटिंग' : 'Your Rating'}
        </label>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Select star rating">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = currentStarDisplay >= star;
            return (
              <button
                key={star}
                type="button"
                aria-label={`${star} stars`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <svg
                  className={`w-7 h-7 transition-colors ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300 fill-slate-100'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            );
          })}
          <span className="text-xs font-bold text-slate-700 ml-2">
            {rating} / 5
          </span>
        </div>
      </div>

      {/* Review Comment Textarea */}
      <div className="mb-4">
        <label htmlFor="review-comment" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          {language === 'hi' ? 'समीक्षा विवरण' : 'Review Comment'}
        </label>
        <textarea
          id="review-comment"
          rows={3}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            if (commentError) setCommentError(false);
            if (errorMessage) setErrorMessage(null);
          }}
          maxLength={1000}
          placeholder={
            language === 'hi'
              ? 'इस सेवा प्रदाता के साथ अपने अनुभव को साझा करें...'
              : 'Share your experience with this service provider...'
          }
          className={`w-full text-sm rounded-xl border p-3 resize-none font-medium transition-colors ${
            commentError
              ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
              : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
          }`}
        />
        <div className="flex justify-end mt-1">
          <span className="text-[11px] text-slate-400">{comment.length}/1000</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isSubmitting}
        >
          {language === 'hi' ? 'समीक्षा सबमिट करें' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};
