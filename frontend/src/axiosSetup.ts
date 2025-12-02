import axios from "axios";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired / unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";  // redirect
    }

    return Promise.reject(error);
  }
);