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
      className="mb-6 cursor-pointer group relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-80 flex flex-col border border-white/20 hover:border-[#51FED6]/30 hover:-translate-y-2"
      onClick={onClick}
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-48 flex-shrink-0 rounded-t-2xl overflow-hidden">
        {pin.image_url ? (
          <>
            <img
              src={`${pin.image_url}?t=${Date.now()}&id=${pin._id || pin.id}`}
              alt={pin.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
              onError={(e) => {
                console.error("Failed to load image:", pin.image_url);
                if (e.target && e.target.parentElement) {
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.parentElement.querySelector('.image-fallback');
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }
              }}
            />
            <div className="image-fallback h-full w-full flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200 absolute inset-0" style={{display: 'none'}}>
              <div className="text-4xl mb-2 opacity-60">🎨</div>
              <p className="text-sm font-medium">Image failed to load</p>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-4xl mb-2 opacity-60">🎨</div>
            <p className="text-sm font-medium">No image</p>
          </div>
        )}
        
        {/* Modern gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Owner badge with glassmorphism */}
        {isOwner && (
          <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
            ✨ Owned
          </div>
        )}

        {/* Floating action button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-white/5">
        <div>
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 h-12 text-lg leading-tight">
            {pin.title}
          </h3>
          
          {pin.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10 leading-relaxed">
              {pin.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <button
            onClick={onUserClick}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-[#51FED6] transition-all duration-200 group/user"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#51FED6] to-[#4AE8C7] rounded-full flex items-center justify-center shadow-md group-hover/user:shadow-lg transition-shadow duration-200">
              <User className="w-4 h-4 text-gray-900" />
            </div>
            <span className="font-semibold">{formatAddress(pin.owner)}</span>
          </button>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1 hover:text-red-500 transition-colors duration-200">
              <span className="text-base">❤️</span>
              <span className="font-medium">{pin.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-1 hover:text-blue-500 transition-colors duration-200">
              <span className="text-base">💬</span>
              <span className="font-medium">{pin.comments || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle border glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#51FED6]/20 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

export default PinGrid;