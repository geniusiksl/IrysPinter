import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const PinModal = ({ pin, onClose, onPurchase, onPinUpdated, wallet, currentWallet }) => {
  const [pinData, setPinData] = useState(pin);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  // Добавить состояния для txid и solana_txid
  const [likeTxid, setLikeTxid] = useState("");
  const [likeSolanaTxid, setLikeSolanaTxid] = useState("");
  const [commentTxid, setCommentTxid] = useState("");
  const [commentSolanaTxid, setCommentSolanaTxid] = useState("");

  const isOwner = pinData.owner === currentWallet;
  const canBuy = pinData.for_sale && !isOwner && wallet.connected;

  useEffect(() => {
    // Use the pin data passed as prop, but fetch additional data if needed
    setPinData(pin);
    fetchComments();
    checkIfLiked();
  }, [pin.id]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/pins/${pinData.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const checkIfLiked = async () => {
    if (!wallet.connected) return;
    
    try {
      const response = await axios.get(`${API}/pins/${pinData.id}/likes/${wallet.publicKey.toString()}`);
      setHasLiked(response.data.has_liked);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const handleLike = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!likeTxid) {
      toast.error("Please provide Irys txid for like");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API}/pins/${pinData.id}/like`, {
        user: wallet.publicKey.toString(),
        txid: likeTxid,
        solana_txid: likeSolanaTxid || undefined
      });
      setHasLiked(true);
      const updatedPin = {
        ...pinData,
        likes: response.data.likes || (pinData.likes || 0) + 1
      };
      setPinData(updatedPin);
      onPinUpdated(updatedPin);
      toast.success("Liked!");
    } catch (error) {
      console.error("Error liking pin:", error);
      toast.error("Failed to like pin");
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!newComment.trim()) return;
    if (!commentTxid) {
      toast.error("Please provide Irys txid for comment");
      return;
    }
    try {
      setCommentLoading(true);
      const response = await axios.post(`${API}/pins/${pinData.id}/comment`, {
        user: wallet.publicKey.toString(),
        content: newComment.trim(),
        txid: commentTxid,
        solana_txid: commentSolanaTxid || undefined
      });
      setComments([response.data, ...comments]);
      setNewComment("");
      setCommentTxid("");
      setCommentSolanaTxid("");
      const updatedPin = {
        ...pinData,
        comments: (pinData.comments || 0) + 1
      };
      setPinData(updatedPin);
      onPinUpdated(updatedPin);
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/pins/${pinData.id}/purchase`, {
        buyer: wallet.publicKey.toString()
      });
      
      onPurchase(response.data);
      toast.success("NFT purchased successfully!");
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      toast.error(error.response?.data?.detail || "Failed to purchase NFT");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2 bg-gray-100 flex items-center justify-center min-h-[400px]">
            {pinData.image_url ? (
              <img
                src={pinData.image_url}
                alt={pinData.title}
                className="w-full h-full object-contain max-h-[600px]"
                onError={(e) => {
                  console.error("Failed to load image:", pinData.image_url);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="flex flex-col items-center justify-center text-gray-500 p-8"
              style={{ display: pinData.image_url ? 'none' : 'flex' }}
            >
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-lg font-medium">Image not available</p>
              <p className="text-sm text-gray-400 mt-2">
                {pinData.image_txid ? `TXID: ${pinData.image_txid.slice(0, 8)}...` : 'No image data'}
              </p>
              <button 
                onClick={() => window.open(pinData.image_url, '_blank')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Open Image in New Tab
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="md:w-1/2 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {pinData.title}
                </h2>
                {pinData.description && (
                  <p className="text-gray-600 mb-4">{pinData.description}</p>
                )}
                
                {/* NFT Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-gray-500 mb-1">NFT Details</div>
                  <div className="text-xs text-gray-400 font-mono">
                    Mint: {pinData.mint_address?.slice(0, 8)}...{pinData.mint_address?.slice(-8)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Owner: {isOwner ? "You" : `${pinData.owner?.slice(0, 8)}...${pinData.owner?.slice(-8)}`}
                  </div>
                </div>

                {/* Price and Purchase */}
                {pinData.for_sale && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-green-600 font-medium">For Sale</div>
                        <div className="text-2xl font-bold text-green-700">
                          {pinData.price} SOL
                        </div>
                      </div>
                      {canBuy && (
                        <button
                          onClick={handlePurchase}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                          {loading ? "Purchasing..." : "Buy Now"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
              >
                ×
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
              {/* Like section */}
              <div className="mb-2">
                <input
                  type="text"
                  value={likeTxid}
                  onChange={e => setLikeTxid(e.target.value)}
                  placeholder="Irys txid for like"
                  className="border px-2 py-1 rounded mr-2 text-xs"
                />
                <input
                  type="text"
                  value={likeSolanaTxid}
                  onChange={e => setLikeSolanaTxid(e.target.value)}
                  placeholder="Solana txid (optional)"
                  className="border px-2 py-1 rounded text-xs"
                />
              </div>
              <button
                onClick={handleLike}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  hasLiked 
                    ? "bg-red-100 text-red-600" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{hasLiked ? "💜" : "🤍"}</span>
                <span>{hasLiked ? "Liked" : "Like"}</span>
                <span className="text-sm">({pinData.likes || 0})</span>
              </button>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Comments ({pinData.comments || 0})
              </h3>

              {/* Add Comment */}
              {wallet.connected && (
                <form onSubmit={handleComment} className="space-y-3">
                  {/* Comment section */}
                  <div className="mb-2">
                    <input
                      type="text"
                      value={commentTxid}
                      onChange={e => setCommentTxid(e.target.value)}
                      placeholder="Irys txid for comment"
                      className="border px-2 py-1 rounded mr-2 text-xs"
                    />
                    <input
                      type="text"
                      value={commentSolanaTxid}
                      onChange={e => setCommentSolanaTxid(e.target.value)}
                      placeholder="Solana txid (optional)"
                      className="border px-2 py-1 rounded text-xs"
                    />
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Add a comment..."
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {commentLoading ? "Adding..." : "Add Comment"}
                  </button>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2">{comment.content}</p>
                        <div className="text-xs text-gray-500">
                          By {comment.user?.slice(0, 8)}...{comment.user?.slice(-8)} • {
                            new Date(comment.created_at).toLocaleDateString()
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModal;