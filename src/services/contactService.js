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

// Used for file uploads: the browser sets the multipart Content-Type itself,
// so we must NOT send "Content-Type: application/json" here.
async function uploadFile(path, field, file) {
  const form = new FormData();
  form.append(field, file);
  const headers = {};
  const token = authService.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: form });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  if (!response.ok) throw new Error(data.message || "The upload failed.");
  return data;
}

export const contactService = {
    // Returns { total, imported, failed, errors: [{ line, name, message }] }
    async importCsv(file) {
      return uploadFile("/contacts/import", "file", file);
    },
  
    // filters: { view: "all" | "favorites" | "followups" | "trash", search, tag }
    async exportCsv(filters = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
      }
      const headers = {};
      const token = authService.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
  
      const response = await fetch(`${API_BASE_URL}/contacts/export?${params}`, { headers });
      if (!response.ok) {
        let message = "The export failed.";
        try {
          message = (await response.json()).message || message;
        } catch {
          // keep the default message
        }
        throw new Error(message);
      }
      const disposition = response.headers.get("Content-Disposition") || "";
      const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] || "contactx-contacts.csv";
      return { blob: await response.blob(), filename };
    },
  
    async uploadPhoto(id, file) {
      const data = await uploadFile(`/contacts/${encodeURIComponent(id)}/photo`, "photo", file);
      return data.contact;
    },
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
