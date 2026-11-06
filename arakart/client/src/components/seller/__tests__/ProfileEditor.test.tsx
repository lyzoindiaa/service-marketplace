import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileEditor } from '../ProfileEditor';
import * as sellerService from '../../../services/sellerService';

vi.mock('../../../services/sellerService', () => ({
  updateSellerProfile: vi.fn(),
  uploadSellerPhoto: vi.fn(),
  deleteSellerPhoto: vi.fn(),
}));

const mockProfile: any = {
  id: 'prov_test_1',
  nameEn: 'Verma Electric Works',
  area: 'Nawada',
  areasServed: ['Nawada'],
  phone: '9876543210',
  whatsapp: '9876543210',
  categories: ['electrician'],
  city: 'ara',
  status: 'approved',
  isLive: true,
  fromPrice: 150,
  services: [{ id: 's1', nameEn: 'Fan Repair', startingPrice: 150 }],
  photos: ['https://res.cloudinary.com/demo/image/upload/sample1.webp'],
  avgRating: 4.8,
  reviewCount: 5,
  profileViews: 10,
  callClicks: 2,
  whatsappClicks: 1,
};

describe('ProfileEditor Component (INT-005 & FE-009)', () => {
  const onProfileUpdatedMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing profile fields and work photos', () => {
    render(<ProfileEditor profile={mockProfile} onProfileUpdated={onProfileUpdatedMock} />);

    expect(screen.getByDisplayValue('Verma Electric Works')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nawada')).toBeInTheDocument();
    expect(screen.getByText(/Work & Shop Photos \(1\/6\)/i)).toBeInTheDocument();
    expect(screen.getByAltText('Shop photo 1')).toBeInTheDocument();
  });

  it('handles uploading a photo and updates list', async () => {
    vi.mocked(sellerService.uploadSellerPhoto).mockResolvedValueOnce({
      photos: [
        'https://res.cloudinary.com/demo/image/upload/sample1.webp',
        'https://res.cloudinary.com/demo/image/upload/sample2.webp',
      ],
    });

    render(<ProfileEditor profile={mockProfile} onProfileUpdated={onProfileUpdatedMock} />);

    const file = new File(['dummy-bytes'], 'work.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(sellerService.uploadSellerPhoto).toHaveBeenCalledWith(file);
      expect(onProfileUpdatedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          photos: expect.arrayContaining([
            'https://res.cloudinary.com/demo/image/upload/sample1.webp',
            'https://res.cloudinary.com/demo/image/upload/sample2.webp',
          ]),
        })
      );
    });
  });

  it('handles deleting a photo', async () => {
    vi.mocked(sellerService.deleteSellerPhoto).mockResolvedValueOnce({
      photos: [],
    });

    render(<ProfileEditor profile={mockProfile} onProfileUpdated={onProfileUpdatedMock} />);

    const deleteBtn = screen.getByTitle('Delete photo');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(sellerService.deleteSellerPhoto).toHaveBeenCalledWith(
        'https://res.cloudinary.com/demo/image/upload/sample1.webp'
      );
      expect(onProfileUpdatedMock).toHaveBeenCalledWith(
        expect.objectContaining({ photos: [] })
      );
    });
  });
});
