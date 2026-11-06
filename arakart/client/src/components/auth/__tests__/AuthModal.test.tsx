import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../AuthModal';
import { useUiStore } from '../../../store/uiStore';
import { useAuthStore } from '../../../store/authStore';
import * as authService from '../../../services/authService';

vi.mock('../../../services/authService');

describe('AuthModal Component (FE-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    useUiStore.setState({ authModalOpen: true });
  });

  it('renders modal when authModalOpen is true with Phone OTP by default', () => {
    render(<AuthModal />);

    expect(screen.getByText(/sign in to arakart/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10-digit mobile/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  it('switches between Phone OTP and Email & Password tabs', () => {
    render(<AuthModal />);

    const emailTab = screen.getByRole('button', { name: /email & password/i });
    fireEvent.click(emailTab);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it('toggles between Sign In and Sign Up in Email tab', () => {
    render(<AuthModal />);

    // Switch to Email tab
    fireEvent.click(screen.getByRole('button', { name: /email & password/i }));

    // By default it shows Sign In
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).toBeNull();

    // Click "Create Account"
    fireEvent.click(screen.getByText(/create account/i));
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('successful login updates authStore and closes modal', async () => {
    vi.mocked(authService.sendPhoneOtp).mockResolvedValueOnce({
      success: true,
      message: 'OTP sent',
      devCode: '123456',
    });

    vi.mocked(authService.verifyPhoneOtp).mockResolvedValueOnce({
      user: {
        id: 'u1',
        name: 'Demo Verified User',
        phone: '9876543210',
        role: 'customer',
        authMethods: ['phone'],
      },
      accessToken: 'test-access-token',
    });

    render(<AuthModal />);

    // Enter phone
    const phoneInput = screen.getByPlaceholderText(/10-digit mobile/i);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    // Click Send OTP
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    // Should now show OTP screen
    await waitFor(() => {
      expect(screen.getByText(/enter 6-digit otp/i)).toBeInTheDocument();
    });

    // Enter OTP
    const codeInputs = screen.getAllByRole('textbox');
    fireEvent.change(codeInputs[0], { target: { value: '1' } });
    fireEvent.change(codeInputs[1], { target: { value: '2' } });
    fireEvent.change(codeInputs[2], { target: { value: '3' } });
    fireEvent.change(codeInputs[3], { target: { value: '4' } });
    fireEvent.change(codeInputs[4], { target: { value: '5' } });
    fireEvent.change(codeInputs[5], { target: { value: '6' } });

    // Submit verify
    fireEvent.click(screen.getByRole('button', { name: /verify & login/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('Demo Verified User');
      expect(useUiStore.getState().authModalOpen).toBe(false);
    });
  });
});
