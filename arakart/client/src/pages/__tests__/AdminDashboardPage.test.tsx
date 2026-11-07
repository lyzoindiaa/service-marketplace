import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../AdminDashboardPage';
import * as adminService from '../../services/adminService';
import * as discoveryService from '../../services/discoveryService';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../services/adminService', () => ({
  fetchAdminDashboardStats: vi.fn(),
  fetchPendingSellers: vi.fn(),
  approveSeller: vi.fn(),
  rejectSeller: vi.fn(),
  fetchAdminUsers: vi.fn(),
  suspendUser: vi.fn(),
  fetchAdminReports: vi.fn(),
  resolveAdminReport: vi.fn(),
  fetchAdminActivity: vi.fn(),
  createAdminCategory: vi.fn(),
  toggleAdminCategory: vi.fn(),
  createAdminCity: vi.fn(),
  toggleAdminCity: vi.fn(),
}));

vi.mock('../../services/discoveryService', () => ({
  fetchCategories: vi.fn(),
  fetchCities: vi.fn(),
}));

const mockStats: adminService.AdminDashboardStats = {
  totalUsers: 48,
  totalSellers: 14,
  pendingSellers: 2,
  approvedSellers: 12,
  totalLeads: 85,
  totalReviews: 29,
  totalCategories: 8,
  totalCities: 1,
  callsCount: 55,
  whatsappCount: 30,
};

const mockPendingSellers = {
  sellers: [
    {
      id: 'prov_pending_1',
      nameEn: 'Verma Electric Service',
      categories: ['electrician'],
      area: 'Nawada',
      phone: '9876543210',
      status: 'pending',
      createdAt: new Date().toISOString(),
      services: [{ nameEn: 'Switchboard Repair', startingPrice: 150 }],
      owner: { name: 'Sunil Verma', phone: '9876543210' },
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, pages: 1 },
};

const mockUsers = {
  users: [
    {
      id: 'usr_1',
      name: 'Ravi Kumar',
      email: 'ravi@example.com',
      phone: '9800011122',
      role: 'customer' as const,
      suspended: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_2',
      name: 'Spam User',
      phone: '9800099999',
      role: 'customer' as const,
      suspended: true,
      createdAt: new Date().toISOString(),
    },
  ],
  pagination: { page: 1, limit: 10, total: 2, pages: 1 },
};

const mockReports = {
  reports: [
    {
      id: 'rep_1',
      provider: {
        id: 'prov_1',
        nameEn: 'Maa Tara Plumbers',
        phone: '9876500000',
        area: 'Anaith',
      },
      reportedBy: {
        id: 'usr_3',
        name: 'Gopal Singh',
        phone: '9800033333',
      },
      reason: 'wrong_info',
      details: 'Shop closed permanently',
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, pages: 1 },
};

describe('AdminDashboardPage (FE-010)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: { id: 'usr_admin', name: 'Super Admin', role: 'admin', authMethods: ['email'] },
      isAuthenticated: true,
      accessToken: 'token_admin',
    });

    vi.mocked(adminService.fetchAdminDashboardStats).mockResolvedValue(mockStats);
    vi.mocked(adminService.fetchPendingSellers).mockResolvedValue(mockPendingSellers);
    vi.mocked(adminService.fetchAdminUsers).mockResolvedValue(mockUsers);
    vi.mocked(adminService.fetchAdminReports).mockResolvedValue(mockReports);
    vi.mocked(adminService.fetchAdminActivity).mockResolvedValue({
      activity: [
        {
          id: 'act_1',
          type: 'lead',
          description: 'New call inquiry for Maa Tara Plumbers',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    vi.mocked(discoveryService.fetchCategories).mockResolvedValue([]);
    vi.mocked(discoveryService.fetchCities).mockResolvedValue([]);
  });

  const renderAdmin = () => {
    return render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );
  };

  it('renders admin KPI strip: total users, approved providers, pending sellers, and leads', async () => {
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('48')).toBeInTheDocument(); // total users
      expect(screen.getByText('12')).toBeInTheDocument(); // approved sellers
      expect(screen.getByText('2')).toBeInTheDocument(); // pending sellers
      expect(screen.getByText('85')).toBeInTheDocument(); // total leads
    });
  });

  it('navigates to Pending Approvals and allows approving a seller', async () => {
    vi.mocked(adminService.approveSeller).mockResolvedValueOnce({
      ...mockPendingSellers.sellers[0],
      status: 'approved',
    });

    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('48')).toBeInTheDocument();
    });

    // Click Pending Approvals tab
    const pendingTab = screen.getByRole('button', { name: /pending approvals/i });
    fireEvent.click(pendingTab);

    await waitFor(() => {
      expect(screen.getByText('Verma Electric Service')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /approve seller/i })).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /approve seller/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(adminService.approveSeller).toHaveBeenCalledWith('prov_pending_1');
    });
  });

  it('navigates to User Management and toggles suspension for a user', async () => {
    vi.mocked(adminService.suspendUser).mockResolvedValueOnce({
      ...mockUsers.users[0],
      suspended: true,
    });

    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('48')).toBeInTheDocument();
    });

    const usersTab = screen.getByRole('button', { name: /user management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
      expect(screen.getByText('Spam User')).toBeInTheDocument();
    });

    // Click Suspend button for Ravi Kumar
    const suspendBtns = screen.getAllByRole('button', { name: /suspend/i });
    fireEvent.click(suspendBtns[0]);

    await waitFor(() => {
      expect(adminService.suspendUser).toHaveBeenCalledWith('usr_1', true);
    });
  });

  it('shows user list with self-admin row displaying "Cannot suspend self" instead of suspend button', async () => {
    vi.mocked(adminService.fetchAdminUsers).mockResolvedValueOnce({
      users: [
        {
          id: 'usr_admin',
          name: 'Super Admin',
          email: 'admin@arakart.local',
          role: 'admin' as const,
          suspended: false,
          createdAt: new Date().toISOString(),
        },
        ...mockUsers.users,
      ],
      pagination: { page: 1, limit: 10, total: 3, pages: 1 },
    });

    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('48')).toBeInTheDocument();
    });

    const usersTab = screen.getByRole('button', { name: /user management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('Cannot suspend self')).toBeInTheDocument();
    });
  });

  it('navigates to Abuse Reports and resolves an open report', async () => {
    vi.mocked(adminService.resolveAdminReport).mockResolvedValueOnce({
      ...mockReports.reports[0],
      status: 'resolved',
    });

    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('48')).toBeInTheDocument();
    });

    const reportsTab = screen.getByRole('button', { name: /abuse reports/i });
    fireEvent.click(reportsTab);

    await waitFor(() => {
      expect(screen.getByText(/Maa Tara Plumbers/i)).toBeInTheDocument();
      expect(screen.getByText(/Shop closed permanently/i)).toBeInTheDocument();
    });

    const resolveBtn = screen.getByRole('button', { name: /resolve report/i });
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(adminService.resolveAdminReport).toHaveBeenCalledWith('rep_1', 'resolved', expect.any(String));
    });
  });

  it('navigates to separate Categories and Cities tabs', async () => {
    vi.mocked(discoveryService.fetchCategories).mockResolvedValueOnce([
      { id: 'cat_1', nameEn: 'Electrician', nameHi: 'इलेक्ट्रीशियन', slug: 'electrician', icon: '⚡', enabled: true },
    ]);
    vi.mocked(discoveryService.fetchCities).mockResolvedValueOnce([
      { id: 'city_1', nameEn: 'Ara', nameHi: 'आरा', slug: 'ara', stateEn: 'Bihar', stateHi: 'बिहार', isLive: true },
    ]);

    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('48')).toBeInTheDocument();
    });

    // Test Categories tab
    const catTab = screen.getByRole('button', { name: /Categories/i });
    fireEvent.click(catTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Service Categories/i })).toBeInTheDocument();
    });

    // Test Cities tab
    const cityTab = screen.getByRole('button', { name: /Cities/i });
    fireEvent.click(cityTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Launch Cities/i })).toBeInTheDocument();
    });
  });
});
