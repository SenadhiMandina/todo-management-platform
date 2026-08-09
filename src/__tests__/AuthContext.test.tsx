import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';

const signUpMock = vi.fn();
const signInMock = vi.fn();
const signOutMock = vi.fn();
const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();

vi.mock('../lib/supabase', () => ({
  default: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
      signInWithPassword: (...args: unknown[]) => signInMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
      getSession: (...args: unknown[]) => getSessionMock(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
    },
  },
}));

function Probe() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [lastError, setLastError] = useState<string | null>(null);

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="last-error">{lastError ?? 'none'}</span>
      <button onClick={() => signIn('test@example.com', 'password123')}>login</button>
      <button
        onClick={async () => {
          const { error } = await signIn('bad@example.com', 'wrong');
          setLastError(error);
        }}
      >
        login-invalid
      </button>
      <button onClick={() => signUp('Test User', 'test@example.com', 'password123')}>register</button>
      <button onClick={() => signOut()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    signUpMock.mockReset();
    signInMock.mockReset();
    signOutMock.mockReset();
    getSessionMock.mockReset().mockResolvedValue({ data: { session: null } });
    onAuthStateChangeMock.mockReset().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  it('resolves loading to false after the initial session check', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('calls supabase signInWithPassword with the given credentials (login)', async () => {
    signInMock.mockResolvedValue({ error: null });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByText('login').click();
    });

    expect(signInMock).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('surfaces a login error message instead of throwing', async () => {
    signInMock.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByText('login-invalid').click();
    });

    await waitFor(() =>
      expect(screen.getByTestId('last-error').textContent).toBe('Invalid login credentials')
    );
  });

  it('calls supabase signUp with the provided name/email/password (registration)', async () => {
    signUpMock.mockResolvedValue({ error: null });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByText('register').click();
    });

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: { data: { full_name: 'Test User' } },
    });
  });

  it('calls supabase signOut on logout', async () => {
    signOutMock.mockResolvedValue({ error: null });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(signOutMock).toHaveBeenCalled();
  });
});
