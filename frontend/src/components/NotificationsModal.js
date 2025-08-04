import React, { useState, useEffect } from "react";
import { Bell, X, Heart, MessageCircle, User, DollarSign } from "lucide-react";
import { notificationsService } from "../services/notificationsService";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";

const NotificationsModal = ({ isOpen, onClose, onNotificationRead }) => {
  const { address } = useEthereumWallet();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'purchase':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Загружаем уведомления при открытии модала
  useEffect(() => {
    if (isOpen && address) {
      loadNotifications();
    }
  }, [isOpen, address]);

  const loadNotifications = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const data = await notificationsService.getNotifications(address);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    if (!address) return;
    
    try {
      await notificationsService.markAsRead(id, address);
      setNotifications(notifications.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      ));
      
      // Вызываем callback для обновления счетчика
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!address) return;
    
    try {
      await notificationsService.markAllAsRead(address);
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      
      // Вызываем callback для обновления счетчика
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#51FED6] rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">Your activity updates</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#51FED6] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mark all as read button */}
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markAllAsRead}
                  className="w-full text-sm text-[#51FED6] hover:text-[#4AE8C7] font-medium mb-4"
                >
                  Mark all as read
                </button>
              )}
              
              {/* Notifications list */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white border-[#51FED6] shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#51FED6] rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-xs text-[#51FED6] hover:text-[#4AE8C7] font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal; 