import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = authService.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.message || "The contact request failed.");
  }
  return data;
}

export const contactService = {
  async list() {
    const data = await request("/contacts");
    return data.contacts;
  },

  async listTrash() {
    const data = await request("/contacts/trash");
    return data.contacts;
  },

  async create(contact) {
    const data = await request("/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    });
    return data.contact;
  },

  async update(id, changes) {
    const data = await request(`/contacts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    return data.contact;
  },

  async remove(id) {
    const data = await request(`/contacts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return data.contact;
  },

  async restore(id) {
    const data = await request(`/contacts/${encodeURIComponent(id)}/restore`, {
      method: "PATCH",
    });
    return data.contact;
  },
};
