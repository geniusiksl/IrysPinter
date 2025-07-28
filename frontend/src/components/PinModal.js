import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useIrys } from "../hooks/useIrys";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const PinModal = ({ pin, onClose, onPurchase, onPinUpdated, wallet, currentWallet }) => {
  const [pinData, setPinData] = useState(pin);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  // Убрали поля для Irys txid - теперь процесс автоматический
  const { buyNFT, sellNFT, uploadToIrys, isBuying, isSelling } = useIrys();

  const isOwner = pinData.owner === currentWallet;
  const canBuy = pinData.for_sale && !isOwner && wallet.isConnected;

  useEffect(() => {
    setPinData(pin);
    fetchComments();
    checkIfLiked();
    // eslint-disable-next-line
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
    if (!wallet.isConnected) return;
    // Здесь можно реализовать проверку лайка по адресу Ethereum
    // setHasLiked(...)
  };

  const handleLike = async () => {
    if (!wallet.isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    try {
      setLikeLoading(true);
      
      // Создаем данные лайка для Irys
      const likeData = {
        type: "like",
        pinId: pinData.id,
        user: wallet.address,
        timestamp: Date.now(),
        pinTitle: pinData.title
      };
      
      // Загружаем в Irys
      const likeBlob = new Blob([JSON.stringify(likeData)], { type: 'application/json' });
      const likeUpload = await uploadToIrys(likeBlob, { type: 'like' });
      
      // Сохраняем в бэкенд с txid
      const response = await axios.post(`${API}/pins/${pinData.id}/like`, {
        user: wallet.address,
        txid: likeUpload.txid
      });
      
      setHasLiked(true);
      const updatedPin = {
        ...pinData,
        likes: response.data.likes || (pinData.likes || 0) + 1
      };
      setPinData(updatedPin);
      onPinUpdated(updatedPin);
      toast.success("Liked and saved to Irys!");
    } catch (error) {
      console.error("Error liking pin:", error);
      toast.error("Failed to like pin");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!wallet.isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!newComment.trim()) return;
    try {
      setCommentLoading(true);
      
      // Создаем данные комментария для Irys
      const commentData = {
        type: "comment",
        pinId: pinData.id,
        user: wallet.address,
        content: newComment.trim(),
        timestamp: Date.now(),
        pinTitle: pinData.title
      };
      
      // Загружаем в Irys
      const commentBlob = new Blob([JSON.stringify(commentData)], { type: 'application/json' });
      const commentUpload = await uploadToIrys(commentBlob, { type: 'comment' });
      
      // Сохраняем в бэкенд с txid
      const response = await axios.post(`${API}/pins/${pinData.id}/comment`, {
        user: wallet.address,
        content: newComment.trim(),
        txid: commentUpload.txid
      });
      
      setComments([response.data, ...comments]);
      setNewComment("");
      const updatedPin = {
        ...pinData,
      };
      setPinData(updatedPin);
      onPinUpdated(updatedPin);
      toast.success("Comment added and saved to Irys!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!wallet.isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    
    // Проверяем, что mint_address является валидным числом
    let tokenId;
    if (pinData.mint_address && !isNaN(pinData.mint_address)) {
      tokenId = parseInt(pinData.mint_address);
    } else {
      toast.error("Invalid NFT token ID");
      return;
    }
    
    try {
      setLoading(true);
      // Вызов функции покупки NFT через контракт
      await buyNFT(tokenId, pinData.price);
      toast.success("NFT purchased successfully!");
      onPurchase({ ...pinData, owner: wallet.address, for_sale: false });
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      toast.error(error.message || "Failed to purchase NFT");
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!wallet.isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!pinData.price) {
      toast.error("Set a price to sell NFT");
      return;
    }
    try {
      setLoading(true);
      // Вызов функции выставления NFT на продажу через контракт
      await sellNFT(pinData.mint_address, pinData.price);
      toast.success("NFT listed for sale!");
      onPinUpdated({ ...pinData, for_sale: true });
    } catch (error) {
      console.error("Error selling NFT:", error);
      toast.error(error.message || "Failed to list NFT for sale");
    } finally {
      setLoading(false);
    }
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
                  src={pinData.image_url}
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
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {pinData.title}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleLike}
                      disabled={likeLoading}
                      className={`text-2xl transition-all duration-200 hover:scale-110 ${
                        hasLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}
                      title="Like will be saved to Irys (requires wallet signature)"
                    >
                      {likeLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                      ) : (
                        hasLiked ? "❤️" : "🤍"
                      )}
                    </button>
                    <span className="text-sm text-gray-500">
                      ({pinData.likes || 0})
                    </span>
                  </div>
                </div>
                {pinData.description && (
                  <p className="text-gray-600 mb-4">{pinData.description}</p>
                )}
                {/* NFT Info */}
                <div className="text-sm text-gray-500 mb-1">NFT Details</div>
                <div className="text-xs text-gray-400 font-mono">
                  Mint: {pinData.mint_address?.slice(0, 8)}...{pinData.mint_address?.slice(-8)}
                </div>
                <div className="text-xs text-gray-400">
                  Owner: {isOwner ? "You" : `${pinData.owner?.slice(0, 8)}...${pinData.owner?.slice(-8)}`}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl ml-4 -mt-2"
              >
                ×
              </button>
            </div>
            {/* Price and Purchase */}
            {pinData.for_sale && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-700 font-medium">For Sale</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {pinData.price} ETH
                    </div>
                  </div>
                  {canBuy && (
                    <button
                      onClick={handlePurchase}
                      disabled={loading || isBuying}
                      className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                    >
                      {loading || isBuying ? "Purchasing..." : "Buy Now"}
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Sell button for owner */}
            {isOwner && (
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Price (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={pinData.price || ""}
                      onChange={(e) => onPinUpdated({ ...pinData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.01"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={pinData.duration || 30}
                      onChange={(e) => onPinUpdated({ ...pinData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                  <button
                    onClick={handleSell}
                    disabled={loading || isSelling}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    {loading || isSelling ? "Listing..." : "List for Sale"}
                  </button>
                </div>
              </div>
            )}
            {/* Comments */}
            <form onSubmit={handleComment} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="border px-3 py-2 rounded-lg w-full text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Comment will be saved to Irys (requires wallet signature)"
                  >
                    {commentLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" 
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </form>
            <div className="space-y-2">
              {comments.map((comment, idx) => (
                <div key={idx} className="bg-gray-100 rounded p-2 text-sm">
                  <span className="font-semibold">{comment.user?.slice(0, 6)}...{comment.user?.slice(-4)}:</span> {comment.content}
                </div>
              ))}
            </div>
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModal;