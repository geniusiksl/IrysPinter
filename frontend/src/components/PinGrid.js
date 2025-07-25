import React from "react";
import Masonry from "react-masonry-css";

const PinGrid = ({ pins, onPinClick, currentWallet }) => {
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
        <p>Be the first to create an NFT pin!</p>
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
            key={pin.id}
            pin={pin}
            onClick={() => onPinClick(pin)}
            isOwner={pin.owner === currentWallet}
          />
        ))}
      </Masonry>
    </div>
  );
};

const PinCard = ({ pin, onClick, isOwner }) => {
  return (
    <div 
      className="mb-4 cursor-pointer group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      onClick={onClick}
    >
      <div className="relative bg-gray-100">
                {pin.image_url ? (
          <img
            src={pin.image_url}
            alt={pin.title}
            className="w-full object-cover"
            loading="lazy"
            onError={(e) => {
              console.error("Failed to load image:", pin.image_url);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            style={{ 
              minHeight: '200px',
              maxHeight: '400px',
              objectFit: 'cover'
            }}
          />
        ) : null}
        <div 
          className="flex flex-col items-center justify-center text-gray-500 p-8"
          style={{ display: pin.image_url ? 'none' : 'flex' }}
        >
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm font-medium">No image</p>
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
        
        {/* Price tag */}
        {pin.price && pin.for_sale && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm font-bold">
            {pin.price} ETH
          </div>
        )}

        {/* Owner badge */}
        {isOwner && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
            Owned
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {pin.title}
        </h3>
        {pin.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {pin.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <span>💜</span>
            <span>{pin.likes || 0}</span>
            <span className="ml-3">💬</span>
            <span>{pin.comments || 0}</span>
          </div>
          
          <div className="text-xs text-gray-400">
            NFT
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinGrid;