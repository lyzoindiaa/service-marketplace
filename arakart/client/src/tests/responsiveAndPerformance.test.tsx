import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineBanner } from '../components/common/OfflineBanner';

describe('Responsive Polish & Performance (FE-012)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders offline warning banner when network connection is lost', () => {
    render(<OfflineBanner />);

    // Initially online
    expect(screen.queryByText(/You are currently offline/i)).not.toBeInTheDocument();

    // Trigger offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

    // Trigger online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByText(/You are currently offline/i)).not.toBeInTheDocument();
  });
});
