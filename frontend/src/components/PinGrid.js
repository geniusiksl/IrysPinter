import React from "react";
import Masonry from "react-masonry-css";
import { User } from "lucide-react";

const PinGrid = ({ pins, onPinClick, currentWallet, onUserClick }) => {
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="text-6xl mb-4">📌</div>
        <h3 className="text-xl font-medium">No pins yet</h3>
        <p className="text-center mb-4">Connect your wallet and create the first pin!</p>
        <div className="text-sm text-gray-400 text-center">
          <p>• Upload your image to Irys</p>
          <p>• Share with the community</p>
          <p>• Connect with other users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {pins.map((pin) => (
          <PinCard
            key={pin._id || pin.id}
            pin={pin}
            onClick={() => onPinClick(pin)}
            onUserClick={(e) => {
              e.stopPropagation();
              onUserClick(pin.owner);
            }}
            isOwner={pin.owner === currentWallet}
          />
        ))}
      </Masonry>
    </div>
  );
};

const PinCard = ({ pin, onClick, onUserClick, isOwner }) => {
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div 
      className="mb-4 cursor-pointer group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      onClick={onClick}
    >
      <div className="relative bg-gray-100">
        {pin.image_url ? (
          <div className="aspect-square overflow-hidden">
            <img
              src={`${pin.image_url}?t=${Date.now()}&id=${pin._id || pin.id}`}
              alt={pin.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                console.error("Failed to load image:", pin.image_url);
                if (e.target) {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center text-gray-500">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm font-medium">No image</p>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
        
        {/* Owner badge */}
        {isOwner && (
          <div className="absolute top-2 left-2 bg-gray-900 text-white px-2 py-1 rounded-full text-xs">
            Owned
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {pin.title}
        </h3>
        
        {pin.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {pin.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={onUserClick}
            className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="w-6 h-6 bg-[#51FED6] rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-gray-900" />
            </div>
            <span className="font-medium">{formatAddress(pin.owner)}</span>
          </button>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <span>❤️</span>
              <span>{pin.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{pin.comments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinGrid;