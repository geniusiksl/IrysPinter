import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useIrys } from "../hooks/useIrys";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { Share2, X } from "lucide-react";

const BACKEND_URL = "https://iryspinter.onrender.com";
const API = `${BACKEND_URL}/api`;

const PinModal = ({ pin, onClose, onPinPurchased, onPinUpdated, currentWallet }) => {
  const [pinData, setPinData] = useState(pin);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);

  const { uploadToIrys } = useIrys();
  const { isConnected, address } = useEthereumWallet();

  const isOwner = pinData.owner === currentWallet;

  useEffect(() => {
    setPinData(pin);
    fetchComments();
    checkIfLiked();
    // eslint-disable-next-line
  }, [pin._id]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/pins/${pinData._id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const checkIfLiked = async () => {
    if (!isConnected || !address) return;
    
    try {
      const response = await axios.get(`${API}/pins/${pinData._id}/likes/${address}`);
      setHasLiked(response.data.liked);
    } catch (error) {
      console.error("Error checking if liked:", error);
    }
  };

  const handleLike = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    try {
      setLikeLoading(true);
      
      // Проверяем баланс Irys перед загрузкой


      

      // Создаем данные лайка для Irys
      const likeData = {
        type: "like",
        pinId: pinData._id,
        user: address,
        timestamp: Date.now(),
        pinTitle: pinData.title
      };
      
      // Загружаем в Irys
      const likeBlob = new Blob([JSON.stringify(likeData)], { type: 'application/json' });
      const likeUpload = await uploadToIrys(likeBlob, { type: 'like' });
      
      // Сохраняем в бэкенд с txid
      const response = await axios.post(`${API}/pins/${pinData._id}/like`, {
        user: address,
        txid: likeUpload.id
      });
      
      setHasLiked(true);
      const updatedPin = {
        ...pinData,
        likes: response.data.likes || (pinData.likes || 0) + 1
      };
      setPinData(updatedPin);
      onPinUpdated(updatedPin);
      toast.success("Liked successfully!");
    } catch (error) {
      console.error("Error liking pin:", error);
      toast.error("Failed to like pin");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    
    try {
      setCommentLoading(true);
      
      // Создаем данные комментария для Irys
      const commentData = {
        type: "comment",
        pinId: pinData._id,
        user: address,
        content: newComment,
        timestamp: Date.now(),
        pinTitle: pinData.title
      };
      
      // Загружаем в Irys
      const commentBlob = new Blob([JSON.stringify(commentData)], { type: 'application/json' });
      const commentUpload = await uploadToIrys(commentBlob, { type: 'comment' });
      
      // Сохраняем в бэкенд с txid
      const response = await axios.post(`${API}/pins/${pinData._id}/comment`, {
        user: address,
        content: newComment,
        txid: commentUpload.id
      });
      
      setComments([response.data, ...comments]);
      const updatedPin = {
        ...pinData,
        comments: (pinData.comments || 0) + 1
      };
      setPinData(updatedPin);
      onPinUpdated(updatedPin);
      setNewComment("");
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!address) return;
    
    try {
      const response = await axios.get(`${API}/conversations/${address}`);
      setConversations(response.data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    }
  };

  const handleShare = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    
    setShowShareModal(true);
    await loadConversations();
  };

  const shareToConversation = async (conversation) => {
    if (!conversation) return;
    
    setShareLoading(true);
    try {
      const otherParticipant = conversation.participants.find(p => p !== address);
      
      // Prepare pin share message data for Irys
      const shareData = {
        sender: address,
        receiver: otherParticipant,
        content: `Shared a pin: ${pinData.title}`,
        messageType: 'pin',
        pinId: pinData._id,
        conversationId: conversation._id,
        timestamp: new Date().toISOString(),
        version: '1.0',
        pinData: {
          title: pinData.title,
          description: pinData.description,
          image_url: pinData.image_url,
          owner: pinData.owner
        }
      };

      // Upload share message to Irys for permanent storage
      let irysId = null;
      try {
        console.log('Uploading pin share to Irys...', shareData);
        
        const shareBlob = new Blob([JSON.stringify(shareData)], { 
          type: 'application/json' 
        });
        
        irysId = await uploadToIrys(shareBlob, {
          'App-Name': 'IrysPinter-Messages',
          'App-Version': '1.0',
          'Message-Type': 'pin-share',
          'Sender': address,
          'Receiver': otherParticipant,
          'Conversation-Id': conversation._id,
          'Pin-Id': pinData._id
        });
        console.log('Pin share uploaded to Irys with ID:', irysId);
      } catch (irysError) {
        console.error('Error uploading to Irys:', irysError);
        toast.error('Failed to save share to Irys, but will save locally');
      }

      // Save message to backend database with Irys ID
      const messagePayload = {
        ...shareData,
        irysId: irysId
      };
      
      console.log('Sending message payload to backend:', messagePayload);
      const response = await axios.post(`${API}/messages`, messagePayload);
      console.log('Backend response:', response.data);

      setShowShareModal(false);
      toast.success(`Pin shared successfully!`);
    } catch (error) {
      console.error("Error sharing pin:", error);
      toast.error("Failed to share pin");
    } finally {
      setShareLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
            {pinData.image_url ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={`${pinData.image_url}?t=${Date.now()}&id=${pinData._id}`}
                  alt={pinData.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '70vh'
                  }}
                  onError={(e) => {
                    console.error("Failed to load image:", pinData.image_url);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 p-8">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-lg font-medium">Image not available</p>
                <p className="text-sm text-gray-400 mt-2">
                  {pinData.image_txid ? `TXID: ${pinData.image_txid.slice(0, 8)}...` : 'No image data'}
                </p>
                {pinData.image_url && (
                  <button
                    onClick={() => window.open(pinData.image_url, '_blank')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Open Image in New Tab
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="md:w-1/2 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900">{pinData.title}</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span className="text-xl">{hasLiked ? '❤️' : '🤍'}</span>
                    <span className="text-sm text-gray-600">({pinData.likes || 0})</span>
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                    title="Share pin"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Share</span>
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {pinData.description && (
              <p className="text-gray-600 mb-4">{pinData.description}</p>
            )}

            {/* Pin Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Owner:</span>
                <span className="text-sm font-mono text-gray-900">
                  {pinData.owner === currentWallet ? "You" : `${pinData.owner.slice(0, 6)}...${pinData.owner.slice(-4)}`}
                </span>
              </div>

            </div>





            {/* Comments Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
              
              {/* Add Comment */}
              <form onSubmit={handleComment} className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6]"
                    disabled={commentLoading}
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="px-4 py-2 bg-[#51FED6] text-gray-900 rounded-lg font-medium disabled:opacity-50"
                  >
                    {commentLoading ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user === currentWallet ? "You" : `${comment.user.slice(0, 6)}...${comment.user.slice(-4)}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Pin</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={pinData.image_url}
                  alt={pinData.title}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{pinData.title}</p>
                  <p className="text-xs text-gray-500 truncate">{pinData.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Select conversation:</h4>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">💬</div>
                  <p className="text-gray-500 text-sm">No conversations found</p>
                  <p className="text-gray-400 text-xs">Start a conversation first</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = conversation.participants.find(p => p !== address);
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => shareToConversation(conversation)}
                      disabled={shareLoading}
                      className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs">👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {formatAddress(otherParticipant)}
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {shareLoading && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#51FED6] mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Sharing pin...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PinModal;