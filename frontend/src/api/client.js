// frontend/src/api/client.js
// -------------------------------------------------------------
// Lightweight fetch wrapper communicating with our FindBack Express backend:
// - Prefixes all request paths with '/api'
// - Automatically includes 'Authorization: Bearer <token>' from localStorage ('lf_token')
// - Parses JSON responses
// - Clears 'lf_token' on 401 Unauthorized
// - Throws Error with server's { error } message if response is not ok
// -------------------------------------------------------------

const TOKEN_KEY = "lf_token";

async function request(path, options = {}) {
  // Ensure path starts with /api
  const cleanPath = path.startsWith("/api")
    ? path
    : `/api${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = { ...options.headers };

  // Attach token if present
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(cleanPath, {
    ...options,
    headers,
  });

  // Handle 401: clear stored token
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
  }

  let data = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get(path) {
    return request(path, { method: "GET" });
  },

  post(path, body) {
    return request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  patch(path, body) {
    return request(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  upload(path, formData) {
    // Do not set Content-Type header so the browser sets multipart boundary automatically
    return request(path, {
      method: "POST",
      body: formData,
    });
  },
};

export default api;
