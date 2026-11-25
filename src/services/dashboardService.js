import { authService } from "./authService";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/+$/, "");

export const dashboardService = {
  async getSummary() {
    const token = authService.getToken();
    const headers = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load dashboard summary.");
    }

    return data.summary;
  },
};