
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, ChevronRight, Percent, Plus, Minus, Map, Navigation, Trash2, CheckCircle2, CreditCard, Banknote } from 'lucide-react';
import { CartItem, Coupon, Address, UserProfile, AdminSettings, BillDetails } from '../types';
import { db } from '../firebase';
import { MapPicker } from './MapPicker';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onPlaceOrder: (billDetails: BillDetails, address: string, paymentMethod: 'COD' | 'ONLINE', paymentId?: string) => void;
  totalAmount: number;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onAddressSelect: (address: Address) => void;
  user: UserProfile | null;
  adminSettings: AdminSettings;
  deliveryDistance: number;
  userOrderCount: number;
  coupons: Coupon[]; // Received from parent
}

export const CartSheet: React.FC<CartSheetProps> = ({ 
  isOpen, 
  onClose, 
  cart, 
  onPlaceOrder,
  totalAmount,
  onUpdateQuantity,
  onRemoveItem,
  onAddressSelect,
  user,
  adminSettings,
  deliveryDistance,
  userOrderCount,
  coupons
}) => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(user?.addresses?.[0] || null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');

  // Address Modal States
  const [tempAddress, setTempAddress] = useState({ house: '', landmark: '', area: '' });
  const [pinCoords, setPinCoords] = useState<{lat: number, lng: number} | null>(null);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  // Filter valid coupons based on First Order, Restaurant, and Category logic
  const validCoupons = coupons.filter(coupon => {
      // 1. First Order Check
      if (coupon.validForFirstOrder && userOrderCount > 0) return false;

      // 2. Restaurant Specific Check
      if (coupon.restaurantId) {
          // If cart is empty, we can't determine restaurant, so hide specific coupons
          if (cart.length === 0) return false;
          // If the coupon is for a different restaurant than what's in the cart
          if (cart[0].restaurantId !== coupon.restaurantId) return false;
      }

      // 3. Category Specific Check
      if (coupon.category) {
          // Check if ANY item in the cart belongs to the required category
          const hasCategoryItem = cart.some(item => item.category === coupon.category);
          if (!hasCategoryItem) return false;
      }

      return true;
  });

  // Calculations based on Admin Settings
  // Logic: Base fee for first 2km, then per km charge for additional distance
  const additionalDistance = Math.max(0, deliveryDistance - 2);
  const originalDeliveryFee = Math.round(
      adminSettings.deliveryBaseFee + (additionalDistance * adminSettings.deliveryPerKm)
  );

  let deliveryFee = originalDeliveryFee;
  const isFreeDelivery = adminSettings.freeDeliveryOrderValue !== undefined && totalAmount >= adminSettings.freeDeliveryOrderValue;

  if (isFreeDelivery) {
      deliveryFee = 0;
  }
  
  const taxes = Math.round(totalAmount * (adminSettings.taxRate / 100));
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.min((totalAmount * appliedCoupon.value) / 100, appliedCoupon.maxDiscount || Infinity);
    } else {
      discountAmount = appliedCoupon.value;
    }
  }
  
  discountAmount = Math.min(discountAmount, totalAmount);
  const finalToPay = Math.round(totalAmount + deliveryFee + taxes - discountAmount);
  
  const billDetails: BillDetails = {
      itemTotal: totalAmount,
      deliveryFee,
      taxes,
      discount: discountAmount,
      grandTotal: finalToPay
  };

  const handleApplyCoupon = (coupon: Coupon) => {
    if (totalAmount < coupon.minOrder) {
      alert(`Minimum order value of ₹${coupon.minOrder} required.`);
      return;
    }
    
    // Safety checks
    if (coupon.validForFirstOrder && userOrderCount > 0) {
        alert("This coupon is only valid for your first order.");
        return;
    }

    if (coupon.restaurantId && cart.length > 0 && cart[0].restaurantId !== coupon.restaurantId) {
        alert("This coupon is not valid for this restaurant.");
        return;
    }

    if (coupon.category && !cart.some(item => item.category === coupon.category)) {
        alert(`This coupon requires an item from category: ${coupon.category}`);
        return;
    }

    setAppliedCoupon(coupon);
    setShowCouponModal(false);
  };

  const removeCoupon = (e: React.MouseEvent) => {
      e.stopPropagation();
      setAppliedCoupon(null);
  };

  const handleChangeAddressClick = () => {
      if (user && user.addresses && user.addresses.length > 0) {
          setShowSavedAddresses(true);
      } else {
          setShowAddressModal(true);
      }
  };

  const handleSelectSavedAddress = (addr: Address) => {
      setSelectedAddress(addr);
      onAddressSelect(addr);
      setShowSavedAddresses(false);
  };

  const handleLocationSelect = (lat: number, lng: number, addr: { area: string, house: string, landmark: string, fullAddress: string }) => {
      setPinCoords({ lat, lng });
      setTempAddress(prev => ({
          ...prev,
          area: addr.area,
          house: addr.house || prev.house, // Preserve existing if map doesn't return precision
          landmark: addr.landmark || prev.landmark
      }));
  };

  const handleAddressConfirm = async () => {
    if (!tempAddress.house) {
        alert("Please enter house/flat number");
        return;
    }
    const newAddr: Address = {
        id: Date.now().toString(),
        type: 'Home',
        houseNo: tempAddress.house,
        area: tempAddress.area || 'Unknown Area',
        landmark: tempAddress.landmark,
        lat: pinCoords?.lat || 28.6139,
        lng: pinCoords?.lng || 77.2090
    };

    if (user) {
        const currentAddresses = user.addresses || [];
        const updatedAddresses = [...currentAddresses, newAddr];
        try {
            await db.ref(`users/${user.uid}/addresses`).set(updatedAddresses);
        } catch(e) {
            console.error("Failed to save address to profile", e);
        }
    }

    setSelectedAddress(newAddr);
    onAddressSelect(newAddr);
    setShowAddressModal(false);
    setShowSavedAddresses(false);
  };

  const initPayment = () => {
    if (!selectedAddress) {
        alert("Please select a delivery address");
        setShowSavedAddresses(true); 
        return;
    }

    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
      const addressStr = `${selectedAddress?.houseNo}, ${selectedAddress?.area}`;

      if (paymentMethod === 'COD') {
          onPlaceOrder(billDetails, addressStr, 'COD');
          setShowPaymentModal(false);
      } else {
          // Razorpay Integration
          const options = {
              key: "rzp_test_1DP5mmOlF5G5ag", // Demo Key. In real app, this comes from backend/env
              amount: finalToPay * 100, // Amount in paise
              currency: "INR",
              name: "OrderEat",
              description: "Food Delivery Order",
              image: "https://b.zmtcdn.com/web_assets/b40b97e677bc7b2ca77c58c61db266fe1603954218.png",
              handler: function (response: any) {
                  onPlaceOrder(billDetails, addressStr, 'ONLINE', response.razorpay_payment_id);
                  setShowPaymentModal(false);
              },
              prefill: {
                  name: user?.name,
                  email: user?.email,
                  contact: user?.phone
              },
              theme: {
                  color: "#9333ea"
              }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any){
                alert(`Payment Failed: ${response.error.description}`);
          });
          rzp.open();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full md:max-w-md bg-gray-50 dark:bg-gray-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 flex justify-between items-center shadow-sm z-10 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-gray-100">
            My Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-hide pb-40 bg-gray-50 dark:bg-gray-950">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" className="w-40 sm:w-48 opacity-80 mix-blend-multiply dark:mix-blend-normal dark:opacity-50" />
              <div>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Good food is always cooking</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Your cart is empty. Add something from the menu.</p>
              </div>
              <button onClick={onClose} className="px-6 py-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition">
                Browse Restaurants
              </button>
            </div>
          ) : (
            <>
              {/* Items Section */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-3 sm:p-4 space-y-5">
                    {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                            <div className="flex items-start gap-2 sm:gap-3 w-3/5">
                                <div className={`mt-1 w-3 h-3 sm:w-4 sm:h-4 border flex items-center justify-center rounded-sm shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm leading-tight">{item.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">₹{item.price}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm h-7 sm:h-8">
                                    <button 
                                        onClick={() => item.quantity > 1 ? onUpdateQuantity(item.id, -1) : onRemoveItem(item.id)}
                                        className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-lg transition"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-5 sm:w-6 text-center text-xs font-bold text-gray-800 dark:text-gray-200">{item.quantity}</span>
                                    <button 
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                        className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-500 hover:text-green-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg transition"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm w-10 sm:w-12 text-right">₹{item.price * item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-950/50 px-4 py-3 border-t border-dashed border-gray-200 dark:border-gray-800">
                    <input type="text" placeholder="Write instructions for delivery partner..." className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-400 font-medium text-gray-800 dark:text-gray-200" />
                </div>
              </div>

              {/* Offers / Coupons */}
              <div 
                onClick={() => setShowCouponModal(true)}
                className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Percent className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                            {appliedCoupon ? `Coupon ${appliedCoupon.code} Applied` : 'Use Coupons'}
                        </span>
                        {appliedCoupon ? (
                            <span className="text-xs text-green-600 font-medium">You saved ₹{discountAmount}</span>
                        ) : (
                            <span className="text-xs text-gray-500">Avail offers and discounts</span>
                        )}
                      </div>
                  </div>
                  {appliedCoupon ? (
                      <button 
                        onClick={removeCoupon} 
                        className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition flex items-center gap-1"
                      >
                         <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                  ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
              </div>

               {/* Delivery Address Section */}
               <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <span className="font-bold text-gray-800 dark:text-gray-200">Delivery Address</span>
                      </div>
                      <button onClick={handleChangeAddressClick} className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase hover:bg-purple-50 dark:hover:bg-purple-900/30 px-2 py-1 rounded transition">
                          {selectedAddress ? 'Change' : 'Add New'}
                      </button>
                  </div>
                  {selectedAddress ? (
                       <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 ml-7">{selectedAddress.type}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 ml-7 border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                                {selectedAddress.houseNo}, {selectedAddress.area} {selectedAddress.landmark && `, ${selectedAddress.landmark}`}
                            </p>
                       </div>
                  ) : (
                      <p className="text-sm text-red-500 ml-7 border-b border-gray-100 dark:border-gray-800 pb-3 mb-3 font-medium">
                          Please select an address to proceed
                      </p>
                  )}
                  
                  <div className="flex items-center gap-3 ml-7">
                      <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-100 dark:border-green-900/30">
                          <Clock className="w-3.5 h-3.5" /> 35 mins
                      </div>
                  </div>
              </div>

              {/* Bill Details */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Bill Details</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Item Total</span>
                        <span>₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span className="underline decoration-dotted cursor-help">
                            Delivery Fee | {deliveryDistance.toFixed(1)} km
                        </span>
                        <span>
                            {isFreeDelivery ? (
                                <>
                                    <span className="line-through text-xs mr-2 opacity-60">₹{originalDeliveryFee}</span>
                                    <span className="text-green-600 font-bold">FREE</span>
                                </>
                            ) : (
                                `₹${deliveryFee}`
                            )}
                        </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span className="underline decoration-dotted cursor-help">GST and Restaurant Charges ({adminSettings.taxRate}%)</span>
                        <span>₹{taxes}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Coupon Discount</span>
                            <span>-₹{discountAmount}</span>
                        </div>
                    )}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between text-base font-black text-gray-900 dark:text-white">
                    <span>To Pay</span>
                    <span>₹{finalToPay}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Fixed */}
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20 safe-area-bottom">
             <div className="flex items-center justify-between mb-3 px-1">
                 <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                     <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                     <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase truncate">
                        {selectedAddress ? `${selectedAddress.houseNo}, ${selectedAddress.area}` : 'Select Address'}
                     </span>
                 </div>
                 {selectedAddress && <span onClick={handleChangeAddressClick} className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase cursor-pointer shrink-0">Change</span>}
             </div>
            <button 
              onClick={initPayment}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition-all active:scale-[0.98] flex justify-between px-6 items-center group"
            >
              <div className="flex flex-col items-start leading-none">
                  <span className="text-xl">₹{finalToPay}</span>
                  <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Total</span>
              </div>
              <span className="flex items-center gap-2">Place Order <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" /></span>
            </button>
          </div>
        )}

        {/* --- COUPON MODAL --- */}
        {showCouponModal && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-lg dark:text-white">Apply Coupon</h3>
                    <button onClick={() => setShowCouponModal(false)}><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-950">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter coupon code" 
                            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 uppercase text-gray-800 dark:text-white bg-white dark:bg-gray-800"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        />
                        <button className="font-bold text-purple-600 dark:text-purple-400 text-sm px-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">APPLY</button>
                    </div>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Available Coupons</h4>
                    {validCoupons.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No coupons available for you right now.</p>
                    ) : (
                        validCoupons.map((coupon, idx) => (
                            <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 relative overflow-hidden group">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-dashed border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded text-xs font-bold inline-block mb-2">
                                            {coupon.code}
                                        </div>
                                        {coupon.validForFirstOrder && (
                                            <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-900/50">
                                                NEW USER
                                            </span>
                                        )}
                                        {coupon.restaurantId && (
                                             <span className="ml-2 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-900/50">
                                                RESTAURANT SPECIAL
                                            </span>
                                        )}
                                        {coupon.category && (
                                             <span className="ml-2 text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold border border-orange-200 dark:border-orange-900/50">
                                                {coupon.category} Only
                                            </span>
                                        )}
                                        <h5 className="font-bold text-gray-800 dark:text-gray-200">{coupon.description}</h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min order: ₹{coupon.minOrder}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleApplyCoupon(coupon)}
                                        className="text-purple-600 dark:text-purple-400 font-bold text-sm uppercase hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1 rounded transition"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* --- PAYMENT MODAL --- */}
        {showPaymentModal && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 z-[80] flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-lg dark:text-white">Payment Method</h3>
                    <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <label 
                        className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'COD' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
                        onClick={() => setPaymentMethod('COD')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">Cash / UPI on Delivery</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pay cash or via UPI at doorstep</p>
                            </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'COD' ? 'border-purple-600' : 'border-gray-300'}`}>
                            {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                        </div>
                    </label>

                    <label 
                        className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === 'ONLINE' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
                        onClick={() => setPaymentMethod('ONLINE')}
                    >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">Pay Online</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Credit/Debit Card, Netbanking, UPI</p>
                            </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'ONLINE' ? 'border-purple-600' : 'border-gray-300'}`}>
                            {paymentMethod === 'ONLINE' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                        </div>
                    </label>
                </div>

                <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800">
                     <button 
                        onClick={confirmPayment}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition-all active:scale-[0.98]"
                     >
                         {paymentMethod === 'ONLINE' ? `Pay ₹${finalToPay} Now` : `Place Order (₹${finalToPay})`}
                     </button>
                     <p className="text-center text-[10px] text-gray-400 mt-2">Safe and secure payments powered by Razorpay</p>
                </div>
            </div>
        )}

        {/* --- SAVED ADDRESS SELECTION MODAL --- */}
        {showSavedAddresses && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <h3 className="font-bold text-lg dark:text-white">Select Address</h3>
                    <button onClick={() => setShowSavedAddresses(false)}><X className="w-6 h-6 text-gray-500"/></button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 space-y-3">
                     <button 
                        onClick={() => { setShowSavedAddresses(false); setShowAddressModal(true); }}
                        className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-900/50 rounded-xl shadow-sm text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                        </div>
                        Add New Address
                    </button>

                    <h4 className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2">Saved Addresses</h4>
                    {user?.addresses?.map(addr => (
                         <div 
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 bg-white dark:bg-gray-900 border rounded-xl shadow-sm cursor-pointer flex items-start gap-3 transition ${selectedAddress?.id === addr.id ? 'border-purple-600 ring-1 ring-purple-100 dark:ring-purple-900' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                         >
                             <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${selectedAddress?.id === addr.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{addr.type}</span>
                                     {selectedAddress?.id === addr.id && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                 </div>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {addr.houseNo}, {addr.area}
                                    {addr.landmark && <br/>}
                                    {addr.landmark}
                                 </p>
                             </div>
                         </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- ADD NEW ADDRESS MAP MODAL --- */}
        {showAddressModal && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 z-[70] flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="relative h-3/5 sm:h-2/3 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <MapPicker 
                        height="100%" 
                        onLocationSelect={handleLocationSelect}
                    />
                    
                    <button 
                        className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-md z-20 hover:bg-gray-100"
                        onClick={() => setShowAddressModal(false)}
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-t-3xl -mt-6 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Enter Address Details
                    </h3>
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase">Area / Sector / Locality</label>
                             <input 
                                type="text" 
                                className="w-full border-b border-gray-200 dark:border-gray-800 py-2 focus:outline-none focus:border-purple-600 font-medium text-gray-800 dark:text-gray-200 text-sm bg-transparent"
                                placeholder="e.g. Sector 18, Noida"
                                value={tempAddress.area}
                                onChange={(e) => setTempAddress({...tempAddress, area: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">House / Flat / Block No.</label>
                            <input 
                                type="text" 
                                className="w-full border-b border-gray-200 dark:border-gray-800 py-2 focus:outline-none focus:border-purple-600 font-medium text-gray-800 dark:text-gray-200 text-sm bg-transparent"
                                placeholder="e.g. Flat 202, Sunshine Apts"
                                value={tempAddress.house}
                                onChange={(e) => setTempAddress({...tempAddress, house: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Landmark (Optional)</label>
                            <input 
                                type="text" 
                                className="w-full border-b border-gray-200 dark:border-gray-800 py-2 focus:outline-none focus:border-purple-600 font-medium text-gray-800 dark:text-gray-200 text-sm bg-transparent"
                                placeholder="e.g. Near Metro Station"
                                value={tempAddress.landmark}
                                onChange={(e) => setTempAddress({...tempAddress, landmark: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            {['Home', 'Work', 'Other'].map(type => (
                                <button key={type} className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-200 dark:hover:border-purple-800 hover:text-purple-600 dark:hover:text-purple-400 transition text-gray-600 dark:text-gray-300">
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={handleAddressConfirm}
                        className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50 mt-4 active:scale-[0.98] transition-transform"
                    >
                        Save Address & Proceed
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
