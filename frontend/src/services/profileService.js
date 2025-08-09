import axios from "axios";

const API_BASE_URL = "http://localhost:8001/api";

export const profileService = {
  // Получить пины пользователя
  async getUserPins(walletAddress) {
    try {
      const response = await axios.get(`${API_BASE_URL}/pins/user/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user pins:", error);
      return [];
    }
  },

  // Получить статистику пользователя
  async getUserStats(walletAddress) {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/stats/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return {
        totalPins: 0,
        totalLikes: 0,
        totalViews: 0,
        totalDownloads: 0
      };
    }
  },

  // Получить лайкнутые пины пользователя
  async getLikedPins(walletAddress) {
    try {
      const response = await axios.get(`${API_BASE_URL}/pins/liked/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching liked pins:", error);
      return [];
    }
  },

  // Получить баланс пользователя
  async getUserBalance(walletAddress) {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/balance/${walletAddress}`);
      return response.data.balance;
    } catch (error) {
      console.error("Error fetching user balance:", error);
      return null;
    }
  },

  // Получить профиль пользователя
  async getUserProfile(walletAddress) {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  // Обновить профиль пользователя
  async updateUserProfile(walletAddress, profileData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${walletAddress}`, profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
}; 