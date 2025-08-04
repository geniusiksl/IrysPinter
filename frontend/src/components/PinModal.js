import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useIrys } from "../hooks/useIrys";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const PinModal = ({ pin, onClose, onPinPurchased, onPinUpdated, currentWallet }) => {
  const [pinData, setPinData] = useState(pin);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const { buyNFT, listNFT, delistNFT, checkNFTListing, uploadToIrys, isBuying, isSelling } = useIrys();
  const { isConnected, address } = useEthereumWallet();

  const isOwner = pinData.owner === currentWallet;
  const canBuy = pinData.for_sale && !isOwner && isConnected;

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

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    
    console.log("Pin data for purchase:", pinData);
    console.log("Mint address:", pinData.mint_address);
    console.log("Mint address type:", typeof pinData.mint_address);
    
    // Проверяем, что mint_address является валидным числом
    let tokenId;
    if (pinData.mint_address && pinData.mint_address !== null && !isNaN(pinData.mint_address)) {
      tokenId = parseInt(pinData.mint_address);
      console.log("Valid token ID:", tokenId);
    } else {
      console.error("Invalid mint_address:", pinData.mint_address);
      toast.error("This NFT is not available for purchase. It may not be properly minted.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Проверяем статус листинга в смарт-контракте
      const listingStatus = await checkNFTListing(tokenId);
      console.log("Listing status:", listingStatus);
      
      if (!listingStatus.isListed) {
        toast.error("This NFT is not listed for sale on the blockchain. The owner needs to list it first.");
        return;
      }
      
      // Проверяем соответствие цены
      if (Math.abs(parseFloat(listingStatus.price) - parseFloat(pinData.price)) > 0.000001) {
        toast.error(`Price mismatch. NFT is listed for ${listingStatus.price} ETH, but displayed price is ${pinData.price} ETH`);
        return;
      }
      
      // Вызов функции покупки NFT через контракт
      const purchaseResult = await buyNFT(tokenId, pinData.price);
      
      if (purchaseResult.success) {
        // Обновляем владельца в бэкенде
        const updateResponse = await axios.put(`${API}/pins/${pinData._id}/transfer-ownership`, {
          newOwner: address
        });
        
        const updatedPin = updateResponse.data;
        setPinData(updatedPin);
        onPinPurchased(updatedPin);
        
        // Создаем уведомление о покупке для продавца
        try {
          await axios.post(`${API}/notifications`, {
            user: pinData.owner,
            type: 'purchase',
            title: 'NFT Sold!',
            message: `Your NFT "${pinData.title}" has been sold for ${pinData.price} ETH`,
            pin_id: pinData._id,
            buyer: address
          });
        } catch (notificationError) {
          console.error("Failed to create purchase notification:", notificationError);
        }
        
        toast.success("NFT purchased successfully!");
      }
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      toast.error(error.message || "Failed to purchase NFT");
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!listPrice || parseFloat(listPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    
    // Проверяем, что mint_address является валидным числом
    let tokenId;
    if (pinData.mint_address && pinData.mint_address !== null && !isNaN(pinData.mint_address)) {
      tokenId = parseInt(pinData.mint_address);
    } else {
      console.error("Invalid mint_address:", pinData.mint_address);
      toast.error("This NFT is not available for sale. It may not be properly minted.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Вызов функции выставления NFT на продажу через контракт
      const sellResult = await listNFT(tokenId, listPrice);
      
      if (sellResult.success) {
        // Обновляем статус в базе данных
        const updateResponse = await axios.put(`${API}/pins/${pinData._id}`, {
          for_sale: true,
          price: listPrice
        });
        
        const updatedPin = updateResponse.data;
        setPinData(updatedPin);
        onPinUpdated(updatedPin);
        setListPrice(""); // Очищаем поле ввода
        toast.success("NFT listed for sale!");
      }
    } catch (error) {
      console.error("Error selling NFT:", error);
      toast.error(error.message || "Failed to list NFT for sale");
    } finally {
      setLoading(false);
    }
  };

  const handleDelist = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
    
    // Проверяем, что mint_address является валидным числом
    let tokenId;
    if (pinData.mint_address && pinData.mint_address !== null && !isNaN(pinData.mint_address)) {
      tokenId = parseInt(pinData.mint_address);
    } else {
      console.error("Invalid mint_address:", pinData.mint_address);
      toast.error("This NFT is not available for delisting. It may not be properly minted.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Вызов функции снятия NFT с продажи через контракт
      const delistResult = await delistNFT(tokenId);
      
      if (delistResult.success) {
        // Обновляем статус в базе данных
        const updateResponse = await axios.put(`${API}/pins/${pinData._id}`, {
          for_sale: false,
          price: null
        });
        
        const updatedPin = updateResponse.data;
        setPinData(updatedPin);
        onPinUpdated(updatedPin);
        toast.success("NFT delisted successfully!");
      }
    } catch (error) {
      console.error("Error delisting NFT:", error);
      toast.error(error.message || "Failed to delist NFT");
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
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className="flex items-center space-x-1"
                >
                  <span className="text-xl">{hasLiked ? '❤️' : '🤍'}</span>
                  <span className="text-sm text-gray-600">({pinData.likes || 0})</span>
                </button>
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

            {/* NFT Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Owner:</span>
                <span className="text-sm font-mono text-gray-900">
                  {pinData.owner === currentWallet ? "You" : `${pinData.owner.slice(0, 6)}...${pinData.owner.slice(-4)}`}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Token ID:</span>
                <span className="text-sm font-mono text-gray-900">{pinData.mint_address}</span>
              </div>
              {pinData.for_sale && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Price:</span>
                  <span className="text-sm font-bold text-[#51FED6]">{pinData.price} ETH</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 mb-6">
              {canBuy && (
                <button
                  onClick={handlePurchase}
                  disabled={loading || isBuying}
                  className="w-full bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  {loading || isBuying ? "Buying..." : `Buy for ${pinData.price} ETH`}
                </button>
              )}
              
              {isOwner && pinData.for_sale && (
                <button
                  onClick={handleDelist}
                  disabled={loading || isSelling}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  {loading || isSelling ? "Delisting..." : "Delist"}
                </button>
              )}
              
              {isOwner && !pinData.for_sale && (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      step="0.000001"
                      min="0.000001"
                      placeholder="Enter price in ETH"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6]"
                    />
                    <button
                      onClick={handleSell}
                      disabled={loading || isSelling || !listPrice || parseFloat(listPrice) <= 0}
                      className="px-6 py-2 bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                      {loading || isSelling ? "Listing..." : "List"}
                    </button>
                  </div>
                </div>
              )}
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
    </div>
  );
};

export default PinModal;