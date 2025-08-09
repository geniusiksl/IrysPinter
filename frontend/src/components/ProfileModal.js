import React, { useState, useEffect, useRef } from "react";
import { User, X, Heart, MessageCircle, Trash2, Edit, Save, Camera, Upload } from "lucide-react";
import { profileService } from "../services/profileService";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { useIrys } from "../hooks/useIrys";
import axios from "axios";
import toast from "react-hot-toast";
import { ethers } from "ethers";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const ProfileModal = ({ isOpen, onClose }) => {
  const { address } = useEthereumWallet();
  const { uploadToIrys, checkIrysBalance, fundIrysAccount, isUploading } = useIrys();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [userPins, setUserPins] = useState([]);
  const [likedPins, setLikedPins] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatar_url: ''
  });
  const [stats, setStats] = useState({
    totalPins: 0,
    totalLikes: 0,
    totalLikesOnUserPins: 0,
    totalComments: 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingPin, setDeletingPin] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [irysBalance, setIrysBalance] = useState(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  // Загружаем данные профиля при открытии модала
  useEffect(() => {
    if (isOpen && address) {
      loadProfileData();
      loadEthBalance();
      loadIrysBalance();
    }
  }, [isOpen, address]);

  // Загружаем баланс Irys
  const loadIrysBalance = async () => {
    try {
      setCheckingBalance(true);
      const balance = await checkIrysBalance();
      setIrysBalance(balance);
      console.log(`Irys balance loaded: ${balance} ETH`);
    } catch (error) {
      console.error("Error loading Irys balance:", error);
      setIrysBalance(null);
    } finally {
      setCheckingBalance(false);
    }
  };

  const loadProfileData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Загружаем профиль пользователя
      const profileData = await profileService.getUserProfile(address);
      setUserProfile(profileData);
      setEditForm({
        username: profileData?.username || '',
        displayName: profileData?.displayName || '',
        bio: profileData?.bio || '',
        avatar_url: profileData?.avatar_url || ''
      });
      
      // Загружаем статистику
      const statsData = await profileService.getUserStats(address);
      setStats(statsData);
      
      // Загружаем пины пользователя
      const pinsData = await profileService.getUserPins(address);
      setUserPins(pinsData);
      
      // Загружаем лайкнутые пины
      const likedData = await profileService.getLikedPins(address);
      setLikedPins(likedData);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEthBalance = async () => {
    if (!address) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Проверяем текущую сеть
      const network = await provider.getNetwork();
      console.log("ProfileModal - Current network:", network);
      
      // Если не в Ethereum Mainnet, переключаемся
      if (network.chainId !== 1) {
        try {
          console.log("ProfileModal - Switching to Ethereum Mainnet...");
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }],
          });
          
          // Создаем новый провайдер после переключения
          const newProvider = new ethers.providers.Web3Provider(window.ethereum);
          const newSigner = newProvider.getSigner();
          const balance = await newSigner.getBalance();
          const balanceInEth = ethers.utils.formatEther(balance);
          console.log(`ProfileModal - ETH balance on Ethereum Mainnet: ${balanceInEth} ETH`);
          setEthBalance(balanceInEth);
        } catch (switchError) {
          console.log("ProfileModal - Switch error:", switchError);
          // Если не удалось переключиться, показываем баланс текущей сети
          const balance = await signer.getBalance();
          const balanceInEth = ethers.utils.formatEther(balance);
          console.log(`ProfileModal - ETH balance on current network (${network.name}): ${balanceInEth} ETH`);
          setEthBalance(`${balanceInEth} (${network.name})`);
        }
      } else {
        // Уже в Ethereum Mainnet
        const balance = await signer.getBalance();
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log(`ProfileModal - ETH balance on Ethereum Mainnet: ${balanceInEth} ETH`);
        setEthBalance(balanceInEth);
      }
    } catch (error) {
      console.error("Error loading ETH balance:", error);
      setEthBalance(null);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    
    try {
      console.log("Starting avatar upload...");
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      toast.loading('Uploading avatar to Irys...');
      
      // Проверяем баланс Irys перед загрузкой
      const balance = await checkIrysBalance();
      console.log(`Current Irys balance: ${balance} ETH`);
      
      // Если баланс недостаточен, пытаемся пополнить
      if (parseFloat(balance) < 0.001) {
        console.log('Insufficient Irys balance, attempting to fund account...');
        try {
          await fundIrysAccount(0.001);
          console.log('Irys account funded successfully');
          // Обновляем баланс после пополнения
          await loadIrysBalance();
        } catch (fundError) {
          console.error('Failed to fund Irys account:', fundError);
          throw new Error(`Insufficient Irys balance (${balance} ETH) and failed to fund account: ${fundError.message}`);
        }
      }
      
      console.log("Calling uploadToIrys...");
      // Загружаем файл на Irys
      const uploadResult = await uploadToIrys(file, {
        "Content-Type": file.type,
        "application-id": "IrysPinter",
        "type": "avatar"
      });
      
      console.log("Upload successful:", uploadResult);
      
      // Обновляем форму с новым URL аватара
      setEditForm(prev => ({
        ...prev,
        avatar_url: uploadResult.url
      }));
      
      toast.dismiss();
      toast.success('Avatar uploaded to Irys successfully!');
      
      // Обновляем баланс после загрузки
      await loadIrysBalance();
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.dismiss();
      
      // Более информативное сообщение об ошибке
      let errorMessage = 'Failed to upload avatar to Irys';
      if (error.message.includes('402')) {
        errorMessage = 'Insufficient ETH balance for Irys upload. Please add more ETH to your wallet on Ethereum Mainnet.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (error.message.includes('Ethereum Mainnet')) {
        errorMessage = 'Please switch to Ethereum Mainnet in MetaMask. Irys requires ETH on Ethereum Mainnet.';
      } else if (error.message.includes('Insufficient ETH balance')) {
        errorMessage = error.message;
      } else if (error.message.includes('insufficient')) {
        errorMessage = `Insufficient balance for Irys upload: ${error.message}`;
      } else {
        errorMessage = error.message || 'Failed to upload avatar to Irys';
      }
      
      console.log("Showing error message:", errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSaveProfile = async () => {
    if (!address) return;
    
    setSaving(true);
    try {
      // Проверяем обязательные поля
      if (!editForm.username.trim()) {
        toast.error('Username is required');
        return;
      }
      
      const updatedProfile = await profileService.updateUserProfile(address, editForm);
      setUserProfile(updatedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: userProfile?.username || '',
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || '',
      avatar_url: userProfile?.avatar_url || ''
    });
    setIsEditing(false);
  };

  const handleDeletePin = async (pinId) => {
    if (!address) return;
    
    try {
      setDeletingPin(pinId);
      
      const response = await axios.delete(`${API}/pins/${pinId}`, {
        data: { owner: address }
      });
      
      if (response.data.success) {
        // Удаляем пин из списка
        setUserPins(userPins.filter(pin => pin._id !== pinId));
        
        // Обновляем статистику
        setStats(prev => ({
          ...prev,
          totalPins: prev.totalPins - 1
        }));
        
        toast.success("Pin deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting pin:", error);
      toast.error(error.response?.data?.error || "Failed to delete pin");
    } finally {
      setDeletingPin(null);
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleAvatarClick}
                />
              ) : (
                <div 
                  className="w-16 h-16 bg-[#51FED6] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleAvatarClick}
                >
                  <User className="w-8 h-8 text-gray-900" />
                </div>
              )}
              {isEditing && (
                <button 
                  className="absolute -bottom-1 -right-1 bg-[#51FED6] p-1 rounded-full hover:bg-[#4AE8C7] transition-colors"
                  onClick={handleAvatarClick}
                >
                  <Camera className="w-3 h-3 text-gray-900" />
                </button>
              )}
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Profile" : "My Profile"}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? "Update your profile information" : "Manage your pins and activity"}
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 px-4 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditing && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6]"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6]"
                  placeholder="Enter display name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6]"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Image to Irys</span>
                  </button>
                  <span className="text-sm text-gray-500">or</span>
                  <input
                    type="url"
                    value={editForm.avatar_url}
                    onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6]"
                    placeholder="https://gateway.irys.xyz/..."
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  💡 Images are stored on Irys decentralized storage. Requires ETH on Ethereum Mainnet for upload.
                </p>
                {editForm.avatar_url && (
                  <div className="mt-2">
                    <img
                      src={editForm.avatar_url}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        toast.error('Invalid image URL');
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleSaveProfile}
                disabled={saving || isUploading}
                className="bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalPins}</div>
              <div className="text-xs text-gray-500">Pins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalLikesOnUserPins}</div>
              <div className="text-xs text-gray-500">Likes Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalComments}</div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
              <div className="text-xs text-gray-500">Likes Given</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('pins')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pins'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Pins ({userPins.length})
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'liked'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Liked Pins ({likedPins.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#51FED6] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading profile data...</p>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <p className="text-gray-900">{userProfile?.username || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <p className="text-gray-900">{userProfile?.displayName || 'Not set'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <p className="text-gray-900">{userProfile?.bio || 'No bio yet'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                    <p className="text-gray-900 font-mono">{address}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ETH Balance</label>
                    <p className="text-gray-900 font-mono">{ethBalance || 'Loading...'} ETH</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Irys Balance</label>
                    <p className="text-gray-900 font-mono">
                      {checkingBalance ? 'Checking...' : (irysBalance ? `${parseFloat(irysBalance).toFixed(6)} ETH` : 'Not loaded')}
                    </p>
                    {irysBalance && parseFloat(irysBalance) < 0.001 && (
                      <p className="text-sm text-orange-600 mt-1">
                        ⚠️ Low Irys balance. Account will be funded automatically during upload.
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar Storage</label>
                    <p className="text-gray-900">
                      Avatars are stored on <strong>Irys decentralized storage</strong>. 
                      Requires <strong>ETH on Ethereum Mainnet</strong> for upload.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'pins' ? (
            <div className="space-y-4">
              {userPins.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📌</div>
                  <p className="text-gray-500">No pins yet</p>
                  <p className="text-sm text-gray-400">Create your first pin!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPins.map((pin) => (
                    <div key={pin._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="relative mb-3">
                        {pin.image_url ? (
                          <img
                            src={pin.image_url}
                            alt={pin.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🖼️</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {pin.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{pin.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{pin.comments || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeletePin(pin._id)}
                          disabled={deletingPin === pin._id}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingPin === pin._id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {likedPins.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No liked pins yet</p>
                  <p className="text-sm text-gray-400">Like some pins to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {likedPins.map((pin) => (
                    <div key={pin._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="relative mb-3">
                        {pin.image_url ? (
                          <img
                            src={pin.image_url}
                            alt={pin.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🖼️</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {pin.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>{pin.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{pin.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;