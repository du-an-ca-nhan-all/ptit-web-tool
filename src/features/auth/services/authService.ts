export const authService = {
  /**
   * Authenticate user with username & password (Client)
   */
  async login(usernameInput: string, passwordInput: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput }),
    });
    return res.json();
  },

  /**
   * Impersonate another user (Admin action) (Client)
   */
  async impersonate(targetUsernameInput: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/auth/impersonate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ targetUsername: targetUsernameInput }),
    });
    return res.json();
  },

  /**
   * Revert impersonation back to original admin (Client)
   */
  async revertImpersonate() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch('/api/auth/revert-impersonate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  },
};
