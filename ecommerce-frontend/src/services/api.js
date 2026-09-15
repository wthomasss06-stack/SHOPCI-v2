// ecommerce-frontend/src/services/api.js
// VERSION FINALE — Compatible Vite + ShopCI + GPS Livraison

import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Instance Axios avec configuration par défaut
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur — ajout du token JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur — rafraîchissement automatique du token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// API AUTHENTIFICATION
// ============================================
export const authAPI = {
  register: async (userData) => {
    const response = await axiosInstance.post('/users/register/', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axiosInstance.post('/users/login/', credentials);
    const { tokens, user } = response.data;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => !!localStorage.getItem('access_token'),

  forgotPassword: async (data) => {
    const response = await axiosInstance.post('/users/password-reset/', data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await axiosInstance.post('/users/password-reset-confirm/', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await axiosInstance.post('/users/change-password/', data);
    return response.data;
  },

  updateProfile: async (data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await axiosInstance.patch('/users/profile/', data, config);
    return response.data;
  },

  suspendAccount: async () => {
    const response = await axiosInstance.post('/users/suspend-account/');
    return response.data;
  },

  deleteAccount: async () => {
    const response = await axiosInstance.delete('/users/delete-account/');
    return response.data;
  },
};

// ============================================
// API PRODUITS
// ============================================
export const productsAPI = {
  getProducts: async (params = {}) => {
    const response = await axiosInstance.get('/products/', { params });
    return response.data;
  },

  getProduct: async (id) => {
    const response = await axiosInstance.get(`/products/${id}/`);
    return response.data;
  },

  create: async (productData) => {
    const config = productData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await axiosInstance.post('/products/', productData, config);
    return response.data;
  },

  update: async (id, productData) => {
    const config = productData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await axiosInstance.put(`/products/${id}/`, productData, config);
    return response.data;
  },

  updateStock: async (id, stock) => {
    const response = await axiosInstance.patch(`/products/${id}/`, { stock });
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(`/products/${id}/`);
    return response.data;
  },

  search: async (query) => {
    const response = await axiosInstance.get('/products/', { params: { search: query } });
    return response.data;
  },

  getVendorProducts: async (params = {}) => {
    const response = await axiosInstance.get('/products/vendor/', { params });
    return response.data;
  },

  getOutOfStockProducts: async () => {
    return productsAPI.getVendorProducts({ stock: 0 });
  },

  getCategories: async () => {
    const response = await axiosInstance.get('/products/categories/');
    return response.data;
  },
};

// ============================================
// API FAVORIS
// ============================================
export const favoritesAPI = {
  getFavorites: async () => {
    const response = await axiosInstance.get('/products/favorites/');
    return response.data;
  },

  checkFavorite: async (productId) => {
    const response = await axiosInstance.get('/products/favorites/check/', {
      params: { product_id: productId },
    });
    return response.data.is_favorite;
  },

  toggleFavorite: async (productId) => {
    const response = await axiosInstance.post('/products/favorites/toggle/', {
      product_id: productId,
    });
    return response.data;
  },
};

// ============================================
// API COMMANDES — avec GPS & livraison temps réel
// ============================================
export const ordersAPI = {
  // ── Existants ────────────────────────────────────────────────────────
  getAll: async () => {
    const response = await axiosInstance.get('/orders/');
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}/`);
    return response.data;
  },

  create: async (orderData) => {
    const response = await axiosInstance.post('/orders/', orderData);
    return response.data;
  },

  updateStatus: async (id, data) => {
    const response = await axiosInstance.patch(`/orders/${id}/`, data);
    return response.data;
  },

  getVendorOrders: async () => {
    const response = await axiosInstance.get('/orders/vendor/');
    return response.data;
  },

  // ── NOUVEAUX — GPS & Livraison temps réel ────────────────────────────

  /**
   * Vendeur envoie sa position GPS en temps réel
   * @param {number} id  — id de la commande
   * @param {{ lat: number, lng: number }} coords
   */
  updateVendorLocation: async (id, coords) => {
    const response = await axiosInstance.patch(`/orders/${id}/location/`, coords);
    return response.data;
  },

  /**
   * Vendeur envoie une photo du colis (visible par l'acheteur)
   * @param {number}   id       — id de la commande
   * @param {FormData} formData — contient le champ "package_photo"
   */
  sendPackagePhoto: async (id, formData) => {
    const response = await axiosInstance.patch(
      `/orders/${id}/package-photo/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * Vendeur confirme qu'il est arrivé à destination
   * → déclenche l'affichage du bouton de validation chez l'acheteur
   */
  vendorConfirmArrival: async (id) => {
    const response = await axiosInstance.post(`/orders/${id}/vendor-confirm-arrival/`);
    return response.data;
  },

  /**
   * Acheteur confirme la réception de son colis
   * → passe la commande en "delivered"
   * @param {number} id
   * @param {{ rating: number }} data — note 1-5 optionnelle
   */
  confirmDelivery: async (id, data = {}) => {
    const response = await axiosInstance.post(`/orders/${id}/buyer-confirm-delivery/`, data);
    return response.data;
  },
};

// ============================================
// API PANIER
// ============================================
export const cartAPI = {
  getCart: async () => {
    const response = await axiosInstance.get('/cart/');
    return response.data;
  },

  addToCart: async (productId, quantity = 1) => {
    const response = await axiosInstance.post('/cart/add/', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  updateCartItem: async (itemId, quantity) => {
    const response = await axiosInstance.patch(`/cart/items/${itemId}/`, { quantity });
    return response.data;
  },

  removeFromCart: async (itemId) => {
    const response = await axiosInstance.delete(`/cart/items/${itemId}/delete/`);
    return response.data;
  },

  clearCart: async () => {
    const response = await axiosInstance.delete('/cart/clear/');
    return response.data;
  },
};

// ============================================
// API CATÉGORIES
// ============================================
export const categoriesAPI = {
  getAll: async () => {
    const response = await axiosInstance.get('/products/categories/');
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/products/categories/${id}/`);
    return response.data;
  },
};

// ============================================
// API NOTIFICATIONS VENDEUR
// ============================================
export const notificationsAPI = {
  getVendorNotifications: async () => {
    const response = await axiosInstance.get('/orders/vendor/');
    const orders = response.data?.results || response.data || [];

    const sorted = [...orders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return sorted.slice(0, 20).map(order => ({
      id:         order.id,
      orderId:    order.id,
      text:       `Nouvelle commande #${order.id}`,
      sub:        formatRelativeTime(order.created_at),
      status:     order.status,
      total:      order.total_amount || order.total,
      buyer:      order.buyer_name || 'Client',
      created_at: order.created_at,
    }));
  },

  markAllRead: (notifications) => {
    if (notifications.length > 0) {
      localStorage.setItem('nb_last_seen_order_id', String(notifications[0].id));
      localStorage.setItem('nb_last_seen_at', new Date().toISOString());
    }
  },

  getUnreadCount: (notifications) => {
    const lastSeenId = parseInt(localStorage.getItem('nb_last_seen_order_id') || '0', 10);
    return notifications.filter(n => n.id > lastSeenId).length;
  },
};

// ── Utilitaire interne ─────────────────────────────────────────────────────
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "À l'instant";
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default axiosInstance;    