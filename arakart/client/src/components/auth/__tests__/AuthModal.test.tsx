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

  it('renders modal when authModalOpen is true with Email & Password Sign In by default (no Phone OTP tab)', () => {
    render(<AuthModal />);

    expect(screen.getByText(/sign in to arakart/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /phone otp/i })).toBeNull();
  });

  it('toggles between Sign In and Create Account in Email form', () => {
    render(<AuthModal />);

    // By default it shows Sign In
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).toBeNull();

    // Click "Create Account"
    fireEvent.click(screen.getByText(/create account/i));
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('successful direct email registration updates authStore and closes modal without OTP step', async () => {
    vi.mocked(authService.registerEmail).mockResolvedValueOnce({
      user: {
        id: 'u1',
        name: 'Ramesh Kumar',
        email: 'ramesh@example.com',
        role: 'customer',
        authMethods: ['email'],
      },
      accessToken: 'direct-register-token',
      message: 'Account created successfully',
    });

    render(<AuthModal />);

    fireEvent.click(screen.getByText(/create account/i));

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Ramesh Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'ramesh@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'StrongPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('Ramesh Kumar');
      expect(useUiStore.getState().authModalOpen).toBe(false);
    });
  });

  it('successful email login updates authStore and closes modal', async () => {
    vi.mocked(authService.loginEmail).mockResolvedValueOnce({
      user: {
        id: 'u2',
        name: 'Demo Verified User',
        email: 'demo@example.com',
        role: 'customer',
        authMethods: ['email'],
      },
      accessToken: 'test-access-token',
    });

    render(<AuthModal />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'demo@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('Demo Verified User');
      expect(useUiStore.getState().authModalOpen).toBe(false);
    });
  });
});
