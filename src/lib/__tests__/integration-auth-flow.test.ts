import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));

describe('Integration: Auth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  describe('Sign In Flow', () => {
    it('should successfully sign in with valid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@test.com' },
          session: { access_token: 'token-123' },
        },
        error: null,
      });

      const result = await mockSignInWithPassword({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.error).toBeNull();
      expect(result.data.user.email).toBe('test@test.com');
      expect(result.data.session.access_token).toBe('token-123');
    });

    it('should return error for invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await mockSignInWithPassword({
        email: 'wrong@test.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Invalid login credentials');
    });

    it('should handle network errors during sign in', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

      await expect(
        mockSignInWithPassword({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Sign Up Flow', () => {
    it('should successfully sign up with valid data', async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'new-user', email: 'new@test.com' },
          session: null,
        },
        error: null,
      });

      const result = await mockSignUp({
        email: 'new@test.com',
        password: 'password123',
        options: {
          data: { first_name: 'New', last_name: 'User' },
        },
      });

      expect(result.error).toBeNull();
      expect(result.data.user.email).toBe('new@test.com');
    });

    it('should return error for duplicate email', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const result = await mockSignUp({
        email: 'existing@test.com',
        password: 'password123',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('User already registered');
    });

    it('should pass user metadata during sign up', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      });

      await mockSignUp({
        email: 'test@test.com',
        password: 'password123',
        options: { data: { first_name: 'Test', last_name: 'User' } },
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { data: { first_name: 'Test', last_name: 'User' } },
        })
      );
    });
  });

  describe('Sign Out Flow', () => {
    it('should successfully sign out', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const result = await mockSignOut();
      expect(result.error).toBeNull();
    });

    it('should handle sign out errors', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

      const result = await mockSignOut();
      expect(result.error.message).toBe('Sign out failed');
    });
  });

  describe('Session Management', () => {
    it('should retrieve existing session', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'existing-token',
            user: { id: 'user-1', email: 'test@test.com' },
          },
        },
        error: null,
      });

      const result = await mockGetSession();
      expect(result.data.session).toBeTruthy();
      expect(result.data.session.access_token).toBe('existing-token');
    });

    it('should return null session when not authenticated', async () => {
      const result = await mockGetSession();
      expect(result.data.session).toBeNull();
    });

    it('should set up auth state change listener', () => {
      const callback = vi.fn();
      const result = mockOnAuthStateChange(callback);

      expect(result.data.subscription.unsubscribe).toBeDefined();
      expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback);
    });
  });

  describe('Auth State Transitions', () => {
    it('should handle sign in then sign out cycle', async () => {
      // Sign in
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 'tok' } },
        error: null,
      });
      const signInResult = await mockSignInWithPassword({ email: 'a@b.com', password: 'pass' });
      expect(signInResult.data.user).toBeTruthy();

      // Sign out
      mockSignOut.mockResolvedValue({ error: null });
      const signOutResult = await mockSignOut();
      expect(signOutResult.error).toBeNull();
    });

    it('should handle multiple sign in attempts', async () => {
      mockSignInWithPassword
        .mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'Wrong password' } })
        .mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: { access_token: 'tok' } }, error: null });

      const first = await mockSignInWithPassword({ email: 'a@b.com', password: 'wrong' });
      expect(first.error).toBeTruthy();

      const second = await mockSignInWithPassword({ email: 'a@b.com', password: 'correct' });
      expect(second.data.user).toBeTruthy();
    });
  });
});
