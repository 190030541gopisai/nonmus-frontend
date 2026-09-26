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

    // 401 and not already retried and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/v1/auth/refresh")
    ) {
      original._retry = true;

      try {
        await apiClient.get("/v1/auth/refresh");
        return apiClient(original);
      } catch {
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
