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
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.message || "The interaction request failed.");
  }

  return data;
}

export const interactionService = {
  async list(contactId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = `/contacts/${encodeURIComponent(contactId)}/interactions`;
    return request(`${path}${query ? `?${query}` : ""}`);
  },

  async create(contactId, interaction) {
    return request(
      `/contacts/${encodeURIComponent(contactId)}/interactions`,
      {
        method: "POST",
        body: JSON.stringify(interaction),
      },
    );
  },
};
