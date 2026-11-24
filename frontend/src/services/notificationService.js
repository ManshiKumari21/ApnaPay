import api from './api';

const notificationService = {
  /**
   * 1. GET /api/notifications - Get logged-in user's notifications
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.status='all'] - 'all' | 'unread' | 'read'
   */
  getNotifications: async ({ page = 1, limit = 20, status = 'all' } = {}) => {
    const res = await api.get('/notifications', {
      params: { page, limit, status }
    });
    return res.data;
  },

  /**
   * 2. PATCH /api/notifications/:id/read - Mark one notification as read
   * @param {number|string} id
   */
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * 3. POST /api/notifications/read-all - Mark all notifications as read
   */
  markAllAsRead: async () => {
    const res = await api.post('/notifications/read-all');
    return res.data;
  },

  /**
   * 4. GET /api/notification-preferences - Get user's notification preferences
   */
  getPreferences: async () => {
    const res = await api.get('/notification-preferences');
    return res.data;
  }
};

export default notificationService;

