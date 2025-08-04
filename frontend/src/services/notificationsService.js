import axios from "axios";

const API_BASE_URL = "https://iryspinter.onrender.com/api";

export const notificationsService = {
  // Получить уведомления пользователя
  async getNotifications(walletAddress) {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },

  // Отметить уведомление как прочитанное
  async markAsRead(notificationId, walletAddress) {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        walletAddress
      });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  },

  // Отметить все уведомления как прочитанные
  async markAllAsRead(walletAddress) {
    try {
      await axios.put(`${API_BASE_URL}/notifications/read-all`, {
        walletAddress
      });
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  },

  // Создать уведомление (для лайков, комментариев и т.д.)
  async createNotification(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/notifications`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }
}; 