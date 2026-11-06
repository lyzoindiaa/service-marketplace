import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewForm } from '../ReviewForm';
import * as reviewService from '../../../services/reviewService';
import { useAuthStore } from '../../../store/authStore';
import { useUiStore } from '../../../store/uiStore';

vi.mock('../../../services/reviewService', () => ({
  submitReview: vi.fn(),
}));

describe('ReviewForm Component (FE-007)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null });
    useUiStore.setState({ authModalOpen: false });
  });

  it('renders guest prompt with Login button when user is unauthenticated', () => {
    render(<ReviewForm providerId="prov123" onReviewSubmitted={vi.fn()} />);

    expect(screen.getByText(/Login to leave a review/i)).toBeInTheDocument();
    const loginBtn = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginBtn);

    expect(useUiStore.getState().authModalOpen).toBe(true);
  });

  it('renders interactive rating picker and comment textarea when user is authenticated', () => {
    useAuthStore.setState({
      user: { id: 'cust1', name: 'Sunita Sharma', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });

    render(<ReviewForm providerId="prov123" onReviewSubmitted={vi.fn()} />);

    expect(screen.getByText(/Write a Review/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Share your experience/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });

  it('submits review successfully and triggers onReviewSubmitted callback', async () => {
    useAuthStore.setState({
      user: { id: 'cust1', name: 'Sunita Sharma', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });

    const mockCreatedReview = {
      id: 'rev1',
      provider: 'prov123',
      customer: 'cust1',
      customerName: 'Sunita Sharma',
      rating: 5,
      comment: 'Excellent work, very professional and punctual!',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(reviewService.submitReview).mockResolvedValueOnce(mockCreatedReview);

    const onSubmittedMock = vi.fn();
    render(<ReviewForm providerId="prov123" onReviewSubmitted={onSubmittedMock} />);

    // Select star 5
    const star5 = screen.getByLabelText('5 stars');
    fireEvent.click(star5);

    // Enter comment
    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, {
      target: { value: 'Excellent work, very professional and punctual!' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewService.submitReview).toHaveBeenCalledWith({
        providerId: 'prov123',
        rating: 5,
        comment: 'Excellent work, very professional and punctual!',
      });
      expect(onSubmittedMock).toHaveBeenCalledWith(mockCreatedReview);
    });
  });

  it('displays error message when customer has already reviewed this provider (409 conflict)', async () => {
    useAuthStore.setState({
      user: { id: 'cust1', name: 'Sunita Sharma', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });

    const errorResponse: any = new Error('You have already reviewed this provider');
    errorResponse.response = {
      status: 409,
      data: { message: 'You have already reviewed this provider' },
    };
    vi.mocked(reviewService.submitReview).mockRejectedValueOnce(errorResponse);

    render(<ReviewForm providerId="prov123" onReviewSubmitted={vi.fn()} />);

    // Select star 4
    const star4 = screen.getByLabelText('4 stars');
    fireEvent.click(star4);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: 'Already reviewed comment' } });

    const submitBtn = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/already reviewed this provider/i)).toBeInTheDocument();
    });
  });
});
