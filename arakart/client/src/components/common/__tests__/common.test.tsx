import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Badge } from '../Badge';
import { Modal } from '../Modal';
import { Pagination } from '../Pagination';
import { StarRating } from '../StarRating';
import { EmptyState } from '../EmptyState';

describe('Common UI Components (FE-002)', () => {
  describe('Button', () => {
    it('renders with primary variant and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows spinner and is disabled when loading', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Submit
        </Button>
      );

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders danger and whatsapp variants', () => {
      const { rerender } = render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');

      rerender(<Button variant="whatsapp">WhatsApp</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-emerald-600');
    });
  });

  describe('Input', () => {
    it('renders with label and displays validation error', () => {
      render(
        <Input
          label="Mobile Number"
          name="phone"
          error="Invalid 10-digit number"
          placeholder="Enter 10-digit phone"
        />
      );

      expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid 10-digit number/i)).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders verified, open, closed and category variants', () => {
      const { rerender } = render(<Badge variant="verified">Verified</Badge>);
      expect(screen.getByText('Verified')).toHaveClass('text-indigo-700');

      rerender(<Badge variant="open">Open Now</Badge>);
      expect(screen.getByText('Open Now')).toHaveClass('text-emerald-700');

      rerender(<Badge variant="closed">Closed</Badge>);
      expect(screen.getByText('Closed')).toHaveClass('text-rose-700');
    });
  });

  describe('Modal', () => {
    it('renders content and calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal body content</p>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal body content')).toBeInTheDocument();

      const closeBtn = screen.getByLabelText(/close modal/i);
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('closes when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Escape Modal">
          <p>Content</p>
        </Modal>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('StarRating', () => {
    it('interactive mode: clicking star 4 calls onChange(4)', () => {
      const handleChange = vi.fn();
      render(<StarRating rating={0} interactive onChange={handleChange} />);

      const stars = screen.getAllByRole('button');
      expect(stars.length).toBe(5);

      fireEvent.click(stars[3]); // 4th star (index 3)
      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('read-only mode: renders rating display without triggering clicks', () => {
      const handleChange = vi.fn();
      render(<StarRating rating={4.5} interactive={false} onChange={handleChange} />);

      expect(screen.queryByRole('button')).toBeNull();
      expect(screen.getByLabelText(/rating: 4.5 out of 5 stars/i)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('renders pages, triggers onPageChange, and disables Previous on page 1', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      const prevBtn = screen.getByRole('button', { name: /previous/i });
      expect(prevBtn).toBeDisabled();

      const nextBtn = screen.getByRole('button', { name: /next/i });
      expect(nextBtn).not.toBeDisabled();

      fireEvent.click(nextBtn);
      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it('disables Next on last page', () => {
      const handlePageChange = vi.fn();
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );

      const nextBtn = screen.getByRole('button', { name: /next/i });
      expect(nextBtn).toBeDisabled();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and calls onAction when button clicked', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No providers found"
          description="Try adjusting your area filter or search keyword."
          actionLabel="Clear Filters"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('No providers found')).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your area filter/i)).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });
});
