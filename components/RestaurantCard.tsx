import React, { useState, useEffect } from 'react';
import { Star, Clock, Percent } from 'lucide-react';
import { Restaurant, Coupon } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
  offers?: Coupon[];
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick, offers = [] }) => {
  // Offline status handling
  const isOffline = restaurant.isOnline === false;
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  useEffect(() => {
    if (offers.length > 1) {
        const timer = setInterval(() => {
            setCurrentOfferIndex(prev => (prev + 1) % offers.length);
        }, 5000);
        return () => clearInterval(timer);
    }
  }, [offers.length]);

  return (
    <div 
      onClick={() => onClick(restaurant)}
      className="bg-white dark:bg-gray-900 rounded-2xl hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
    >
      <div className="relative h-60 rounded-2xl overflow-hidden m-3 mb-0">
        <img 
          src={restaurant.imageUrl || 'https://picsum.photos/400/300'} 
          alt={restaurant.name}
          className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ${isOffline ? 'grayscale' : ''}`}
        />
        
        {/* Offline Overlay */}
        {isOffline && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider shadow-lg text-sm">
                    Currently Closed
                </span>
            </div>
        )}

        {/* Dark Gradient at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent"></div>

        {/* Promoted Tag */}
        {restaurant.promoted && !isOffline && (
            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase">
            Promoted
            </div>
        )}

        {/* Time Pill */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-700" />
          {restaurant.deliveryTime}
        </div>
        
        {/* Dynamic Offers Carousel or Static Discount */}
        {!isOffline && (
             <div className="absolute bottom-3 left-3 max-w-[70%]">
                {offers.length > 0 ? (
                    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 key={currentOfferIndex}">
                        <Percent className="w-3 h-3" />
                        <span className="truncate">
                            {offers[currentOfferIndex].discountType === 'FLAT' 
                                ? `₹${offers[currentOfferIndex].value} OFF` 
                                : `${offers[currentOfferIndex].value}% OFF`
                            }
                            <span className="opacity-70 mx-1">|</span> 
                            {offers[currentOfferIndex].code}
                        </span>
                    </div>
                ) : restaurant.discount ? (
                    <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-md uppercase">
                        {restaurant.discount}
                    </div>
                ) : null}
             </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className={`text-lg font-bold truncate max-w-[70%] ${isOffline ? 'text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>{restaurant.name}</h3>
          <div className={`flex items-center text-white px-1.5 py-0.5 rounded-md text-xs font-bold shadow-sm h-5 ${isOffline ? 'bg-gray-400' : 'bg-green-700'}`}>
            <span className="mr-0.5">{restaurant.rating.toFixed(1)}</span>
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3 font-normal">
          <p className="truncate w-2/3">{(restaurant.cuisine || []).join(', ')}</p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">₹{restaurant.priceForTwo}</p>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center gap-3">
             <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <img src="https://b.zmtcdn.com/data/o2_assets/0b07ef18234c6fdf9365ad1c274ae0631612687510.png" alt="safe" className="w-3 h-3 opacity-60" />
             </div>
             <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-tight line-clamp-1">
                Follows all Max Safety measures to ensure your food is safe
             </p>
        </div>
      </div>
    </div>
  );
};