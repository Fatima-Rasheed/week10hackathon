import axios from 'axios';

/**
 * Returns an axios instance with the Authorization header set
 * from the token stored in localStorage.
 * Automatically redirects to /login on 401 responses.
 */
export function authAxios() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const instance = axios.create({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Intercept 401 responses and redirect to login
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return instance;
}
