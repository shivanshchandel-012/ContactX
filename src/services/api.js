const API_URL = import.meta.env.VITE_API_URL;

export function isApiConfigured() {
  return Boolean(API_URL);
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured.");
  }

  const token = localStorage.getItem("contactx_token");
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }

  return data;
}

export const authApi = {
  register(payload) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export const contactsApi = {
  list(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/api/contacts${suffix}`);
  },
  create(payload) {
    return request("/api/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return request(`/api/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  remove(id) {
    return request(`/api/contacts/${id}`, { method: "DELETE" });
  },
};
