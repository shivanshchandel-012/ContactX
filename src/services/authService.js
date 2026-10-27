const TOKEN_KEY = "contactx_token";
const USER_KEY = "contactx_user";

// Use relative /api URL to benefit from Vite proxy or direct relative routing in deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class AuthService {
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setSession(token, user) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to store session in localStorage:", e);
    }
  }

  clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error("Failed to clear session from localStorage:", e);
    }
  }

  isAuthenticated() {
    return Boolean(this.getToken());
  }

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to sign in. Please try again.");
    }

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }

    return data;
  }

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed. Please try again.");
    }

    return data;
  }

  async getMe() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearSession();
        }
        return null;
      }

      const data = await response.json();
      if (data.user) {
        this.setSession(token, data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      console.error("Error fetching current user:", err);
      return this.getUser();
    }
  }

  logout() {
    this.clearSession();
  }
}

export const authService = new AuthService();
