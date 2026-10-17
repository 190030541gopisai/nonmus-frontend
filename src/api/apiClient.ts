import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // 401 and not already retried, not the refresh endpoint itself,
    // and not an auth action endpoint (login/signup — expected 401s that
    // must propagate to the caller, not trigger a token refresh loop)
    const AUTH_ACTION_URLS = ["v1/auth/login", "v1/auth/signup"];
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/v1/auth/refresh") &&
      !AUTH_ACTION_URLS.some((u) => original.url?.includes(u))
    ) {
      original._retry = true;

      try {
        await apiClient.get("/v1/auth/refresh");
        return apiClient(original);
      } catch {
        if(!AUTH_ACTION_URLS.some((u) => original.url?.includes(u))) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
