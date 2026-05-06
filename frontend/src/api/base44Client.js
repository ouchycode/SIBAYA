const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const TOKEN_KEY = "siba_auth_token";
const USER_KEY = "siba_auth_user";

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = Object.assign(new Error(data.message || "Request failed"), {
      status: response.status,
      data,
    });
    throw error;
  }

  return data;
}

function createEntityClient(entityName) {
  const resource = entityName.toLowerCase();
  const rolePath = getRolePathPrefix();
  return {
    list() {
      return request(`${rolePath}/${resource}`);
    },
    filter(params = {}, orderBy = "", limit = 20) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.set(key, value);
        }
      });
      if (orderBy) query.set("order_by", orderBy);
      if (limit) query.set("limit", String(limit));
      return request(`${rolePath}/${resource}?${query.toString()}`);
    },
    create(payload) {
      return request(`${rolePath}/${resource}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id, payload) {
      return request(`${rolePath}/${resource}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    delete(id) {
      return request(`${rolePath}/${resource}/${id}`, {
        method: "DELETE",
      });
    },
  };
}

function getRolePathPrefix() {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    throw new Error("User belum login.");
  }

  const user = JSON.parse(rawUser);
  if (user?.role === "admin") return "/admin";
  if (user?.role === "dosen") return "/dosen";
  if (user?.role === "mahasiswa") return "/mahasiswa";
  throw new Error("Role user tidak valid.");
}

export const base44 = {
  auth: {
    async login(email, password) {
      const payload = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      return payload.user;
    },
    async me() {
      const user = await request("/auth/me");
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    },
    logout(redirectUrl = "/login") {
      const token = localStorage.getItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (token) {
        request("/auth/logout", { method: "POST" }).catch(() => null);
      }
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin(redirectUrl = "/login") {
      window.location.href = redirectUrl;
    },
  },
  entities: new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        return createEntityClient(prop);
      },
    },
  ),
};
