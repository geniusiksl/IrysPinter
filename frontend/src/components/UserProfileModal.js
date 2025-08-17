import React, { useState, useEffect } from "react";
import { X, User, Heart, MessageCircle, Users, UserPlus, UserMinus } from "lucide-react";
import axios from "axios";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import toast from "react-hot-toast";

const BACKEND_URL = "https://iryspinter.onrender.com";
const API = `${BACKEND_URL}/api`;

const UserProfileModal = ({ isOpen, onClose, userAddress }) => {
  const { address } = useEthereumWallet();
  const [user, setUser] = useState(null);
  const [userPins, setUserPins] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pins');

  useEffect(() => {
    if (isOpen && userAddress) {
      loadUserProfile();
    }
  }, [isOpen, userAddress]);

  const loadUserProfile = async () => {
    if (!userAddress) return;
    
    setLoading(true);
    try {
      // Load user profile
      const userResponse = await axios.get(`${API}/users/${userAddress}`);
      setUser(userResponse.data);
      
      // Load user pins
      const pinsResponse = await axios.get(`${API}/pins/user/${userAddress}`);
      setUserPins(pinsResponse.data);
      
      // Load followers
      const followersResponse = await axios.get(`${API}/users/${userAddress}/followers`);
      setFollowers(followersResponse.data);
      
      // Load following
      const followingResponse = await axios.get(`${API}/users/${userAddress}/following`);
      setFollowing(followingResponse.data);
      
      // Check if current user is following this user
      if (address && address !== userAddress) {
        setIsFollowing(userResponse.data.followers.includes(address));
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast.error("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    
    if (address === userAddress) {
      toast.error("You cannot follow yourself");
      return;
    }
    
    try {
      const response = await axios.post(`${API}/users/${userAddress}/follow`, {
        followerAddress: address
      });
      
      setIsFollowing(response.data.isFollowing);
      
      if (response.data.isFollowing) {
        toast.success("Successfully followed user");
      } else {
        toast.success("Successfully unfollowed user");
      }
      
      // Reload profile data
      loadUserProfile();
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast.error("Failed to follow/unfollow user");
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isOpen || !userAddress) return null;

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
          
          {loading ? (
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#51FED6] rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.displayName || formatAddress(user.address)}
                  </h2>
                  <p className="text-sm text-gray-600">
                    @{user.username || formatAddress(user.address)}
                  </p>
                  {user.bio && (
                    <p className="text-sm text-gray-700 mt-1">{user.bio}</p>
                  )}
                </div>
              </div>
              
              {address && address !== userAddress && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-[#51FED6] text-gray-900 hover:bg-[#4AE8C7]'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Stats */}
        {user && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{userPins.length}</div>
                <div className="text-xs text-gray-500">Pins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{followers.length}</div>
                <div className="text-xs text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{following.length}</div>
                <div className="text-xs text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userPins.reduce((total, pin) => total + (pin.likes || 0), 0)}
                </div>
                <div className="text-xs text-gray-500">Total Likes</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pins')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pins'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pins ({userPins.length})
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'followers'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Followers ({followers.length})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'following'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Following ({following.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#51FED6] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading profile data...</p>
            </div>
          ) : activeTab === 'pins' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPins.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-4xl mb-4">📌</div>
                  <p className="text-gray-500">No pins yet</p>
                </div>
              ) : (
                userPins.map((pin) => (
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
                        <Heart className="w-4 h-4" />
                        <span>{pin.likes || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{pin.comments || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'followers' ? (
            <div className="space-y-4">
              {followers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No followers yet</p>
                </div>
              ) : (
                followers.map((follower) => (
                  <div key={follower.address} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#51FED6] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-900" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {follower.displayName || formatAddress(follower.address)}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{follower.username || formatAddress(follower.address)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'following' ? (
            <div className="space-y-4">
              {following.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Not following anyone yet</p>
                </div>
              ) : (
                following.map((followed) => (
                  <div key={followed.address} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#51FED6] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-900" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {followed.displayName || formatAddress(followed.address)}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{followed.username || formatAddress(followed.address)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
