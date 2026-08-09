import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();

vi.mock('../lib/supabase', () => ({
  default: {
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
    },
  },
}));

import { AuthProvider } from '../contexts/AuthContext';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    onAuthStateChangeMock.mockReset().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  it('redirects unauthenticated users to /login', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    renderApp();
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument());
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
  });

  it('renders the protected content for an authenticated user', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: 'abc', user: { id: 'u1', email: 'demo@TodoApp.app' } } },
    });
    renderApp();
    await waitFor(() => expect(screen.getByText('Secret Dashboard')).toBeInTheDocument());
  });
});
