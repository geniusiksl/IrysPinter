import React, { useState, useEffect, useRef } from "react";
import { X, Send, MessageCircle, User, Plus } from "lucide-react";
import axios from "axios";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { useIrys } from "../hooks/useIrys";
import toast from "react-hot-toast";

const BACKEND_URL = "https://iryspinter.onrender.com";
const API = `${BACKEND_URL}/api`;

const MessengerModal = ({ isOpen, onClose, onPinClick }) => {
  const { address } = useEthereumWallet();
  const { uploadToIrys } = useIrys();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationAddress, setNewConversationAddress] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && address) {
      loadConversations();
    }
  }, [isOpen, address]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadConversations = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/conversations/${address}`);
      setConversations(response.data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    
    setLoadingMessages(true);
    try {
      const response = await axios.get(`${API}/conversations/${conversationId}/messages`);
      console.log('Loaded messages:', response.data);
      // Debug: check for pin messages
      response.data.forEach(msg => {
        if (msg.messageType === 'pin') {
          console.log('Pin message found:', msg);
          console.log('Pin data:', msg.pinData);
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const otherParticipant = selectedConversation.participants.find(p => p !== address);
      
      // Prepare message data for Irys
      const messageData = {
        sender: address,
        receiver: otherParticipant,
        content: newMessage.trim(),
        messageType: 'text',
        conversationId: selectedConversation._id,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Upload message to Irys for permanent storage
      let irysId = null;
      try {
        console.log('Uploading message to Irys...', messageData);
        
        // Create Blob from JSON string for Irys upload
        const messageBlob = new Blob([JSON.stringify(messageData)], { 
          type: 'application/json' 
        });
        
        irysId = await uploadToIrys(messageBlob, {
          'App-Name': 'IrysPinter-Messages',
          'App-Version': '1.0',
          'Message-Type': 'chat-message',
          'Sender': address,
          'Receiver': otherParticipant,
          'Conversation-Id': selectedConversation._id
        });
        console.log('Message uploaded to Irys with ID:', irysId);
        toast.success('Message saved to Irys!');
      } catch (irysError) {
        console.error('Error uploading to Irys:', irysError);
        toast.error('Failed to save message to Irys, but will save locally');
      }

      // Save message to backend database with Irys ID
      const response = await axios.post(`${API}/messages`, {
        ...messageData,
        irysId: irysId // Store Irys transaction ID for reference
      });

      setMessages([...messages, response.data]);
      setNewMessage("");
      
      // Update conversation list
      loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const createNewConversation = async (e) => {
    e.preventDefault();
    if (!newConversationAddress.trim()) return;

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(newConversationAddress.trim())) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    if (newConversationAddress.toLowerCase() === address.toLowerCase()) {
      toast.error("You cannot start a conversation with yourself");
      return;
    }

    setCreatingConversation(true);
    try {
      const response = await axios.post(`${API}/conversations`, {
        participants: [address, newConversationAddress.trim()]
      });

      // Add new conversation to list or select existing one
      await loadConversations();
      setSelectedConversation(response.data);
      setShowNewConversationModal(false);
      setNewConversationAddress("");
      toast.success("Conversation started!");
    } catch (error) {
      console.error("Error creating conversation:", error);
      if (error.response?.status === 409) {
        // Conversation already exists
        toast.error("Conversation with this address already exists");
      } else {
        toast.error("Failed to start conversation");
      }
    } finally {
      setCreatingConversation(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 h-[80vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#51FED6] rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
              <p className="text-sm text-gray-600">Chat with other users</p>
            </div>
          </div>
        </div>

        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Conversations</h3>
                <button
                  onClick={() => setShowNewConversationModal(true)}
                  className="bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 p-2 rounded-full transition-colors"
                  title="Start new conversation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#51FED6] mx-auto"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find(p => p !== address);
                    return (
                      <div
                        key={conversation._id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?._id === conversation._id
                            ? 'bg-[#51FED6] text-gray-900'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Messages Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatAddress(selectedConversation.participants.find(p => p !== address))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#51FED6] mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No messages yet</p>
                        <p className="text-gray-400 text-xs">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      // Debug logging for each message
                      if (message.messageType === 'pin') {
                        console.log('Rendering pin message:', message._id, message.messageType, message.pinData);
                      }
                      
                      return (
                        <div
                          key={message._id}
                          className={`flex ${message.sender === address ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`${message.messageType === 'pin' ? 'max-w-sm' : 'max-w-xs'} px-4 py-2 rounded-lg ${
                              message.sender === address
                                ? 'bg-[#51FED6] text-gray-900'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.messageType === 'pin' && message.pinData ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">{message.content}</p>
                              <div 
                                className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                  if (onPinClick && message.pinId) {
                                    onPinClick(message.pinId);
                                  }
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <img
                                    src={message.pinData.image_url}
                                    alt={message.pinData.title}
                                    className="w-16 h-16 object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="hidden w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">🖼️</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {message.pinData.title}
                                    </h4>
                                    {message.pinData.description && (
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {message.pinData.description}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      by {message.pinData.owner === address ? 'You' : formatAddress(message.pinData.owner)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs opacity-70">
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {formatTime(message.created_at)}
                              </p>
                            </>
                          )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-100">
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6]"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-[#51FED6] text-gray-900 rounded-lg hover:bg-[#4AE8C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 w-96 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Start New Conversation</h3>
              <button
                onClick={() => {
                  setShowNewConversationModal(false);
                  setNewConversationAddress("");
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={createNewConversation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Ethereum Address
                </label>
                <input
                  type="text"
                  value={newConversationAddress}
                  onChange={(e) => setNewConversationAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6]"
                  disabled={creatingConversation}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the Ethereum address of the person you want to message
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewConversationModal(false);
                    setNewConversationAddress("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creatingConversation}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newConversationAddress.trim() || creatingConversation}
                  className="flex-1 px-4 py-2 bg-[#51FED6] text-gray-900 rounded-lg hover:bg-[#4AE8C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingConversation ? "Starting..." : "Start Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessengerModal;
