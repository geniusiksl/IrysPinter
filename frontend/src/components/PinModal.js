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
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeTxid, setLikeTxid] = useState("");
  const [commentTxid, setCommentTxid] = useState("");
  const { buyNFT, sellNFT, isBuying, isSelling } = useIrys();

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
    if (!likeTxid) {
      toast.error("Please provide Irys txid for like");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API}/pins/${pinData.id}/like`, {
        user: wallet.address,
        txid: likeTxid
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
    if (!wallet.isConnected) {
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
        user: wallet.address,
        content: newComment.trim(),
        txid: commentTxid
      });
      setComments([response.data, ...comments]);
      setNewComment("");
      setCommentTxid("");
      const updatedPin = {
        ...pinData,
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
    if (!wallet.isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    try {
      setLoading(true);
      // Вызов функции покупки NFT через контракт
      await buyNFT(pinData.mint_address, pinData.price);
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
              {pinData.image_url && (
                <button
                  onClick={() => window.open(pinData.image_url, '_blank')}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Open Image in New Tab
                </button>
              )}
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
                className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
              >
                ×
              </button>
            </div>
            {/* Price and Purchase */}
            {pinData.for_sale && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">For Sale</div>
                    <div className="text-2xl font-bold text-green-700">
                      {pinData.price} ETH
                    </div>
                  </div>
                  {canBuy && (
                    <button
                      onClick={handlePurchase}
                      disabled={loading || isBuying}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      {loading || isBuying ? "Purchasing..." : "Buy Now"}
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Sell button for owner */}
            {isOwner && !pinData.for_sale && (
              <div className="mb-4">
                <button
                  onClick={handleSell}
                  disabled={loading || isSelling}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {loading || isSelling ? "Listing..." : "List for Sale"}
                </button>
              </div>
            )}
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
            {/* Comments */}
            <form onSubmit={handleComment} className="mb-4">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="border px-2 py-1 rounded w-2/3 text-sm"
              />
              <input
                type="text"
                value={commentTxid}
                onChange={e => setCommentTxid(e.target.value)}
                placeholder="Irys txid for comment"
                className="border px-2 py-1 rounded w-1/3 text-xs ml-2"
              />
              <button
                type="submit"
                disabled={commentLoading}
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
              >
                {commentLoading ? "Adding..." : "Comment"}
              </button>
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