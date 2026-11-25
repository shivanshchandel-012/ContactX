import { authService } from "./authService";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const token = authService.getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "The follow-up request failed.");
  }

  return data;
}

export const followUpService = {
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    const data = await request(`/follow-ups${query ? `?${query}` : ""}`);
    return data;
  },

  async create(followUp) {
    return request("/follow-ups", {
      method: "POST",
      body: JSON.stringify(followUp),
    });
  },

  async update(id, changes) {
    return request(`/follow-ups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  },

  async remove(id) {
    return request(`/follow-ups/${id}`, {
      method: "DELETE",
    });
  },
};