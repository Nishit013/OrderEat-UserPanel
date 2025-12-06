
// Add global definitions
declare global {
  interface Window {
    Razorpay: any;
    L: any;
  }
}

export interface Variant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  category: string;
  rating?: number;
  votes?: number;
  variants?: Variant[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string; // e.g. "30-40 min"
  priceForTwo: number;
  imageUrl: string;
  menu: Record<string, MenuItem>; // Map for easier Firebase handling
  address: string;
  discount?: string; // e.g. "50% OFF up to ₹100"
  promoted?: boolean;
  lat?: number;
  lng?: number;
  isOnline?: boolean; // True = Open, False = Closed/Offline
  isApproved?: boolean; // True = Visible in User Panel
  offers?: Coupon[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  selectedVariant?: Variant;
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  houseNo: string;
  area: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  addresses?: Address[];
  phone?: string;
}

export interface Coupon {
  id?: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  validForFirstOrder?: boolean;
  restaurantId?: string; // Optional: Only valid for this restaurant
  category?: string;     // Optional: Only valid for items in this category
}

export interface GlobalOffer {
  id?: string;
  isActive: boolean;
  text: string;
  subText?: string;
  backgroundColor?: string;
  textColor?: string;
  // New fields for Modern Banner
  gradientStart?: string;
  gradientEnd?: string;
  actionText?: string;
}

export interface InspirationItem {
  id: string;
  name: string;
  image: string;
}

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface DeliveryPartner {
  name: string;
  phone: string;
  imageUrl?: string;
  rating: number;
}

export interface BillDetails {
  itemTotal: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  grandTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  totalAmount: number;
  billDetails?: BillDetails;
  status: OrderStatus;
  createdAt: number;
  deliveryAddress: string; // snapshot of address string
  deliveryCoordinates?: { lat: number; lng: number }; // For delivery partner navigation
  deliveryPartner?: DeliveryPartner;
  paymentMethod: 'COD' | 'ONLINE';
  paymentId?: string; // Razorpay Payment ID
  ratings?: {
    restaurant: number;
    delivery: number;
  };
}

export interface FilterState {
  sortBy: 'Relevance' | 'Rating' | 'CostLow' | 'CostHigh' | 'DeliveryTime';
  rating: number | null; // e.g. 3.5, 4.0, 4.5
  isVeg: boolean;
  hasOffers: boolean;
  costRange: [number, number] | null; // e.g. [300, 600]
  cuisines: string[];
  deliveryTimeMax?: number; // New: Filter by max delivery time (e.g. 30, 45, 60)
}

export interface AdminSettings {
  taxRate: number;
  deliveryBaseFee: number;
  deliveryPerKm: number;
  platformCommission: number;
  freeDeliveryOrderValue?: number;
}