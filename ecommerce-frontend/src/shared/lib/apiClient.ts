import axios from 'axios'
import { getStoredToken, removeStoredToken } from './tokenStorage';

export const apiClient = axios.create({
    baseURL: import.meta.env.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = getStoredToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

apiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
            removeStoredToken()
            window.location.assign('/login')
        }
        return Promise.reject(error)
    },
)