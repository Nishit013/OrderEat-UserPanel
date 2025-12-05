
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { RestaurantCard } from './components/RestaurantCard';
import { MenuModal } from './components/MenuModal';
import { CartSheet } from './components/CartSheet';
import { OrdersModal } from './components/OrdersModal';
import { ProfileModal } from './components/ProfileModal';
import { AddressSwitchModal } from './components/AddressSwitchModal';
import { FilterModal } from './components/FilterModal';
import { UserProfile, Restaurant, MenuItem, CartItem, Address, Order, Variant, FilterState, OrderStatus, GlobalOffer, InspirationItem, AdminSettings, BillDetails, Coupon } from './types';
import { auth, db } from './firebase';
import { SlidersHorizontal, Check, ArrowRight, CookingPot, Ban, Megaphone, Sparkles, ChevronLeft, ChevronRight, Truck, ShoppingBag, UtensilsCrossed, PackageCheck } from 'lucide-react';

// Enhanced Seed Data with Lat/Lng (Centered around New Delhi: 28.6139, 77.2090)
const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Spicy Tandoor',
    cuisine: ['North Indian', 'Mughlai'],
    rating: 4.2,
    deliveryTime: '30-40 min',
    priceForTwo: 500,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&w=800&q=80',
    address: 'Connaught Place, New Delhi',
    discount: '50% OFF up to ₹100',
    promoted: true,
    lat: 28.6315,
    lng: 77.2167,
    isOnline: true,
    isApproved: true,
    menu: {
      'm1': { 
          id: 'm1', 
          name: 'Butter Chicken', 
          price: 350, 
          isVeg: false, 
          category: 'Recommended', 
          description: 'Rich tomato gravy with tender chicken', 
          rating: 4.5, 
          votes: 1200,
          variants: [
              { name: 'Half', price: 220 },
              { name: 'Full', price: 350 }
          ]
      },
      'm2': { 
          id: 'm2', 
          name: 'Dal Makhani', 
          price: 250, 
          isVeg: true, 
          category: 'Recommended', 
          description: 'Black lentils cooked overnight with cream and butter', 
          rating: 4.8, 
          votes: 2100,
          variants: [
              { name: 'Half', price: 150 },
              { name: 'Full', price: 250 }
          ]
      },
      'm3': { id: 'm3', name: 'Garlic Naan', price: 60, isVeg: true, category: 'Breads', description: 'Fresh tandoor baked bread', rating: 4.3, votes: 500 },
      'm4': { id: 'm4', name: 'Paneer Tikka', price: 280, isVeg: true, category: 'Starters', description: 'Cottage cheese marinated in spices', rating: 4.2, votes: 800 },
      'm5': { id: 'm5', name: 'Chicken Tikka', price: 320, isVeg: false, category: 'Starters', description: 'Juicy chicken chunks roasted in tandoor', rating: 4.4, votes: 950 }
    }
  },
  {
    id: 'r2',
    name: 'Wok in the Clouds',
    cuisine: ['Chinese', 'Asian'],
    rating: 4.0,
    deliveryTime: '40-50 min',
    priceForTwo: 800,
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-4.0.3&w=800&q=80',
    address: 'Rajouri Garden, New Delhi',
    discount: 'Flat ₹125 OFF',
    lat: 28.6427,
    lng: 77.1192,
    isOnline: true,
    isApproved: true,
    menu: {
      'm6': { id: 'm6', name: 'Hakka Noodles', price: 200, isVeg: true, category: 'Noodles', description: 'Stir fried noodles with veggies', rating: 4.1, votes: 300 },
      'm7': { id: 'm7', name: 'Chilli Chicken', price: 320, isVeg: false, category: 'Starters', description: 'Spicy chicken appetizer', rating: 4.3, votes: 450 },
      'm8': { id: 'm8', name: 'Dimsums', price: 280, isVeg: true, category: 'Starters', description: 'Steamed vegetable dumplings', rating: 4.0, votes: 200 },
      'm9': { id: 'm9', name: 'Spring Rolls', price: 180, isVeg: true, category: 'Starters', description: 'Crispy fried rolls with veggie filling', rating: 4.2, votes: 350 }
    }
  },
  {
    id: 'r3',
    name: 'Pizza Palazzo',
    cuisine: ['Italian', 'Fast Food'],
    rating: 3.8,
    deliveryTime: '25-30 min',
    priceForTwo: 400,
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&w=800&q=80',
    address: 'Saket, New Delhi',
    discount: 'Free Dish on ₹400+',
    lat: 28.5245,
    lng: 77.2066,
    isOnline: true,
    isApproved: true,
    menu: {
      'm10': { id: 'm10', name: 'Margherita Pizza', price: 299, isVeg: true, category: 'Recommended', description: 'Classic cheese and tomato pizza', rating: 4.6, votes: 1500 },
      'm11': { id: 'm11', name: 'Pepperoni Pizza', price: 399, isVeg: false, category: 'Pizza', description: 'Loaded with pepperoni slices', rating: 4.7, votes: 1100 },
      'm12': { id: 'm12', name: 'Pasta Alfredo', price: 350, isVeg: true, category: 'Pasta', description: 'White sauce creamy pasta', rating: 4.1, votes: 400 },
      'm13': { id: 'm13', name: 'Garlic Bread', price: 150, isVeg: true, category: 'Sides', description: 'Toasted bread with garlic butter', rating: 4.3, votes: 600 }
    }
  },
  {
    id: 'r4',
    name: 'Burger King',
    cuisine: ['Burger', 'Fast Food'],
    rating: 4.1,
    deliveryTime: '20-25 min',
    priceForTwo: 300,
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&w=800&q=80',
    address: 'Nehru Place, New Delhi',
    discount: '60% OFF',
    promoted: true,
    lat: 28.5492,
    lng: 77.2536,
    isOnline: true,
    isApproved: true,
    menu: {
      'm14': { id: 'm14', name: 'Whopper', price: 199, isVeg: false, category: 'Recommended', description: 'Flame grilled beef patty', rating: 4.5, votes: 2000 },
      'm15': { id: 'm15', name: 'Veggie Burger', price: 129, isVeg: true, category: 'Burgers', description: 'Crispy vegetable patty', rating: 4.0, votes: 800 },
      'm16': { id: 'm16', name: 'Fries', price: 99, isVeg: true, category: 'Sides', description: 'Classic salted fries', rating: 4.2, votes: 1200 }
    }
  },
  {
      id: 'r5',
      name: 'Biryani Blues',
      cuisine: ['Biryani', 'Hyderabadi'],
      rating: 4.3,
      deliveryTime: '45-50 min',
      priceForTwo: 600,
      imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?ixlib=rb-4.0.3&w=800&q=80',
      address: 'Gurgaon, Haryana',
      discount: '20% OFF',
      lat: 28.4595,
      lng: 77.0266,
      isOnline: true,
      isApproved: true,
      menu: {
          'm17': { id: 'm17', name: 'Chicken Biryani', price: 350, isVeg: false, category: 'Recommended', description: 'Aromatic basmati rice with chicken', rating: 4.6, votes: 1800 },
          'm18': { id: 'm18', name: 'Veg Biryani', price: 250, isVeg: true, category: 'Biryani', description: 'Mixed vegetables with spices', rating: 4.1, votes: 500 },
          'm19': { id: 'm19', name: 'Mirchi Ka Salan', price: 100, isVeg: true, category: 'Sides', description: 'Spicy chili curry', rating: 3.9, votes: 200 }
      }
  },
  {
      id: 'r6',
      name: 'Subway',
      cuisine: ['Healthy', 'Sandwich'],
      rating: 4.0,
      deliveryTime: '15-20 min',
      priceForTwo: 350,
      imageUrl: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?ixlib=rb-4.0.3&w=800&q=80',
      address: 'Sector 18, Noida',
      discount: 'Flat ₹50 OFF',
      lat: 28.5700,
      lng: 77.3190,
      isOnline: true,
      isApproved: true,
      menu: {
          'm20': { id: 'm20', name: 'Veggie Delite', price: 180, isVeg: true, category: 'Subs', description: 'Fresh vegetables in your choice of bread', rating: 4.2, votes: 600 },
          'm21': { id: 'm21', name: 'Chicken Teriyaki', price: 220, isVeg: false, category: 'Recommended', description: 'Teriyaki glazed chicken strips', rating: 4.4, votes: 900 }
      }
  }
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  
  // Location State
  const [userLocation, setUserLocation] = useState<{name: string, lat?: number, lng?: number}>({
      name: "Connaught Place, New Delhi",
      lat: 28.6315,
      lng: 77.2167
  });

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({
      sortBy: 'Relevance',
      rating: null,
      isVeg: false,
      hasOffers: false,
      costRange: null,
      cuisines: [],
      deliveryTimeMax: undefined
  });

  // Global Offer / Banner State
  const [banners, setBanners] = useState<GlobalOffer[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  // Admin Settings State
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
      taxRate: 5,
      deliveryBaseFee: 40,
      deliveryPerKm: 10,
      platformCommission: 20
  });

  // Inspiration State
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [loadingInspiration, setLoadingInspiration] = useState(true);
  
  // Selection State
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddressSwitch, setShowAddressSwitch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Live Order Tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [userOrderCount, setUserOrderCount] = useState(0);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Refs
  const restaurantsRef = useRef<HTMLDivElement>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Load User
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const userRef = db.ref(`users/${firebaseUser.uid}`);
        userRef.on('value', (snapshot) => {
            const dbData = snapshot.val();
            let userData: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              phone: dbData?.phone || ''
            };

            if (dbData) {
                if (dbData.name) userData.name = dbData.name;
                userData.addresses = dbData.addresses || [];
                setUser(userData);
                if (userData.addresses && userData.addresses.length > 0) {
                     if (userLocation.name === "Connaught Place, New Delhi") {
                          const defaultAddr = userData.addresses[0];
                          setUserLocation({
                              name: `${defaultAddr.houseNo}, ${defaultAddr.area}`,
                              lat: defaultAddr.lat,
                              lng: defaultAddr.lng
                          });
                     }
                }
            } else {
                 setUser(userData);
            }
        });
        setShowLogin(false);
      } else {
        setUser(null);
        setActiveOrder(null);
        setUserOrderCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load Restaurants
  useEffect(() => {
    const rRef = db.ref('restaurants');
    const listener = rRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ ...data[key], id: key }));
        // Filter out unapproved restaurants
        const visibleRestaurants = list.filter(r => r.isApproved !== false);
        setRestaurants(visibleRestaurants);
      } else {
        setRestaurants(SEED_RESTAURANTS);
      }
      setLoadingRestaurants(false);
    });
    return () => rRef.off('value', listener);
  }, []);

  // Load Coupons
  useEffect(() => {
    const couponsRef = db.ref('coupons');
    const listener = couponsRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data) as Coupon[];
        setCoupons(list);
      } else {
        setCoupons([]);
      }
    });
    return () => couponsRef.off('value', listener);
  }, []);

  // Load Global Offers / Banners
  useEffect(() => {
    const offerRef = db.ref('globalOffer');
    const listener = offerRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        let activeBanners: GlobalOffer[] = [];

        // Check if data is a single legacy object or a map of objects
        if (data.text) {
             // It's a single object (Legacy)
             if (data.isActive) activeBanners.push(data);
        } else {
             // It's a map/array of banners
             const list = Object.keys(data).map(key => ({ ...data[key], id: key })) as GlobalOffer[];
             activeBanners = list.filter(b => b.isActive);
        }
        
        setBanners(activeBanners);
      } else {
        setBanners([]);
      }
    });
    return () => offerRef.off('value', listener);
  }, []);

  // Carousel Auto-slide
  useEffect(() => {
      if (banners.length <= 1) return;
      const timer = setInterval(() => {
          setCurrentBannerIndex(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
  }, [banners.length]);

  const nextBanner = () => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
      setCurrentBannerIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const scrollToRestaurants = () => {
      restaurantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Load Admin Settings
  useEffect(() => {
    const settingsRef = db.ref('adminSettings');
    const listener = settingsRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            setAdminSettings(snapshot.val());
        }
    });
    return () => settingsRef.off('value', listener);
  }, []);

  // Load Inspiration Items
  useEffect(() => {
    const inspRef = db.ref('inspiration');
    const listener = inspRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Array.isArray(data) 
                ? data.filter(Boolean)
                : Object.keys(data).map(key => ({ ...data[key], id: key }));
            setInspirationItems(list);
        } else {
            setInspirationItems([
                { id: '1', name: 'Biryani', image: 'https://b.zmtcdn.com/data/dish_images/d19a31d42d5913ff129caf43dc09e5801634724495.png' },
                { id: '2', name: 'Pizza', image: 'https://b.zmtcdn.com/data/o2_assets/d0bd7c9405ac87f6aa65e31fe55800941632716575.png' },
                { id: '3', name: 'Chicken', image: 'https://b.zmtcdn.com/data/dish_images/197987b7ebcd1ee08f8c25ea4e77e20f1634731334.png' },
                { id: '4', name: 'Burger', image: 'https://b.zmtcdn.com/data/dish_images/ccb7dc91eba53cd19ecb8891fba2fcc71634805057.png' },
                { id: '5', name: 'Rolls', image: 'https://b.zmtcdn.com/data/dish_images/c2f22c42f7ba90d81440a88449f4e5891634806087.png' },
                { id: '6', name: 'Thali', image: 'https://b.zmtcdn.com/data/o2_assets/52eb9796bb9bcf0eba64c64d868229951632716604.png' }
            ]);
        }
        setLoadingInspiration(false);
    });
    return () => inspRef.off('value', listener);
  }, []);

  // Monitor Active Orders and Count User Orders
  useEffect(() => {
    if (!user) return;
    const ordersRef = db.ref('orders');
    const listener = ordersRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const allOrders = Object.values(snapshot.val()) as Order[];
            const myOrders = allOrders.filter(o => o.userId === user.uid);
            
            setUserOrderCount(myOrders.length);

            // Find ongoing order
            const ongoing = myOrders.sort((a,b) => b.createdAt - a.createdAt).find(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
            if (ongoing) setActiveOrder(ongoing);
            else setActiveOrder(null);
        } else {
            setActiveOrder(null);
            setUserOrderCount(0);
        }
    });
    return () => ordersRef.off('value', listener);
  }, [user]);

  const handleAddToCart = (item: MenuItem, restaurantId: string, variant?: Variant) => {
    if (cart.length > 0 && cart[0].restaurantId !== restaurantId) {
      if (!window.confirm("Start a new basket? Adding items from a new restaurant will clear your current cart.")) return;
      const newItem: CartItem = {
          ...item, quantity: 1, restaurantId, price: variant ? variant.price : item.price, selectedVariant: variant
      };
      setCart([newItem]);
      return;
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.id === item.id && i.selectedVariant?.name === variant?.name);
      if (existingIdx > -1) {
         const newCart = [...prev];
         newCart[existingIdx].quantity += 1;
         return newCart;
      }
      const newItem: CartItem = {
          ...item, quantity: 1, restaurantId, price: variant ? variant.price : item.price, selectedVariant: variant
      };
      return [...prev, newItem];
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => {
      const index = prev.findIndex(i => i.id === itemId);
      if (index === -1) return prev;
      if (prev[index].quantity > 1) {
          const newCart = [...prev];
          newCart[index].quantity -= 1;
          return newCart;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };
  
  const handleUpdateQuantity = (itemId: string, delta: number) => {
      setCart(prev => {
          const idx = prev.findIndex(i => i.id === itemId);
          if(idx > -1) {
              const newCart = [...prev];
              if (delta > 0) newCart[idx].quantity += 1;
              else {
                  if (newCart[idx].quantity > 1) newCart[idx].quantity -= 1;
                  else newCart.splice(idx, 1);
              }
              return newCart;
          }
          return prev;
      });
  };
  
  const handleAddressSelect = (address: Address) => {
      setUserLocation({ name: `${address.houseNo}, ${address.area}`, lat: address.lat, lng: address.lng });
      setShowAddressSwitch(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate delivery distance for the cart
  let cartDeliveryDistance = 0;
  if (cart.length > 0 && userLocation.lat && userLocation.lng) {
      const cartRest = restaurants.find(r => r.id === cart[0].restaurantId);
      if (cartRest && cartRest.lat && cartRest.lng) {
          cartDeliveryDistance = calculateDistance(userLocation.lat, userLocation.lng, cartRest.lat, cartRest.lng);
      }
  }

  const handlePlaceOrder = async (billDetails: BillDetails, addressStr: string, paymentMethod: 'COD' | 'ONLINE', paymentId?: string) => {
    if (!user) { setShowLogin(true); return; }
    
    const orderData = {
      userId: user.uid,
      restaurantId: cart[0].restaurantId,
      restaurantName: restaurants.find(r => r.id === cart[0].restaurantId)?.name || 'Unknown',
      items: cart,
      totalAmount: billDetails.grandTotal,
      billDetails,
      status: OrderStatus.PLACED,
      createdAt: Date.now(),
      deliveryAddress: addressStr,
      paymentMethod,
      paymentId: paymentId || null
    };

    const sanitizedOrder = JSON.parse(JSON.stringify(orderData));

    try {
      await db.ref('orders').push(sanitizedOrder);
      setCart([]);
      setIsCartOpen(false);
      setSelectedRestaurant(null);
      alert("Order placed successfully! Track it in the 'Orders' section.");
    } catch (e) { 
        console.error(e);
        alert("Failed to place order."); 
    }
  };

  const handleReorder = (order: Order) => {
      if (cart.length > 0) {
          if (!window.confirm("This will replace your current cart. Continue?")) return;
      }
      
      const newCartItems = order.items.map(item => ({...item})); // Deep copy items
      setCart(newCartItems);
      setIsCartOpen(true);
      
      const rest = restaurants.find(r => r.id === order.restaurantId);
      if (rest) setSelectedRestaurant(rest);
  };

  const handleCancelLiveOrder = async (orderId: string) => {
      if (!window.confirm("Are you sure you want to cancel this order?")) return;
      try {
          await db.ref(`orders/${orderId}`).update({
              status: OrderStatus.CANCELLED
          });
      } catch (e) {
          console.error("Cancellation failed", e);
          alert("Failed to cancel order.");
      }
  };

  const handleLogout = async () => {
    try { await auth.signOut(); setUserLocation({ name: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167 }); setShowProfile(false); } catch (e) {}
  };
  
  // Advanced Filter Logic
  const allCuisines = Array.from(new Set(restaurants.flatMap(r => r.cuisine || []))).sort();
  
  const filteredRestaurants = restaurants.map(r => {
      if (userLocation.lat && userLocation.lng && r.lat && r.lng) {
          return { ...r, distance: calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng) };
      }
      return { ...r, distance: 0 };
  }).filter(r => {
      // 1. Distance (6km)
      if (r.distance > 6) return false;

      // 2. Search
      if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = r.name.toLowerCase().includes(query);
          const matchesCuisine = (r.cuisine || []).some(c => c.toLowerCase().includes(query));
          const matchesMenu = Object.values(r.menu || {}).some((m: any) => m.name.toLowerCase().includes(query));
          if (!matchesName && !matchesCuisine && !matchesMenu) return false;
      }
      
      // 3. Rating
      if (filterState.rating && r.rating < filterState.rating) return false;
      
      // 4. Veg
      if (filterState.isVeg) {
          const menuItems = Object.values(r.menu || {}) as MenuItem[];
          if (menuItems.length === 0 || !menuItems.every(item => item.isVeg)) return false;
      }

      // 5. Cost Range
      if (filterState.costRange) {
          const [min, max] = filterState.costRange;
          if (r.priceForTwo < min || r.priceForTwo > max) return false;
      }

      // 6. Offers
      if (filterState.hasOffers && !r.discount) return false;

      // 7. Cuisines
      if (filterState.cuisines.length > 0) {
          const hasCuisine = (r.cuisine || []).some(c => filterState.cuisines.includes(c));
          if (!hasCuisine) return false;
      }

      // 8. Delivery Time Max
      if (filterState.deliveryTimeMax) {
          const time = parseInt(r.deliveryTime);
          if (time > filterState.deliveryTimeMax) return false;
      }

      return true;
  }).sort((a, b) => {
      // Priority 1: Promoted Status (Promoted first)
      if (a.promoted && !b.promoted) return -1;
      if (!a.promoted && b.promoted) return 1;

      // Priority 2: User Filters
      if (filterState.sortBy === 'Rating') return b.rating - a.rating;
      if (filterState.sortBy === 'CostLow') return a.priceForTwo - b.priceForTwo;
      if (filterState.sortBy === 'CostHigh') return b.priceForTwo - a.priceForTwo;
      if (filterState.sortBy === 'DeliveryTime') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      if (userLocation.lat && userLocation.lng) return a.distance - b.distance;
      return 0; 
  });

  const activeFiltersCount = [
    filterState.rating !== null,
    filterState.isVeg,
    filterState.hasOffers,
    filterState.costRange !== null,
    filterState.cuisines.length > 0,
    filterState.deliveryTimeMax !== undefined
  ].filter(Boolean).length;

  // Determine progress width for live order
  const getProgress = (status: OrderStatus) => {
      switch(status) {
          case 'PLACED': return '10%';
          case 'CONFIRMED': return '30%';
          case 'PREPARING': return '60%';
          case 'OUT_FOR_DELIVERY': return '90%';
          case 'DELIVERED': return '100%';
          default: return '0%';
      }
  };

  if (showLogin) {
    return <Login onLoginSuccess={() => setShowLogin(false)} />;
  }

  return (
    <div className="min-h-screen pb-20 bg-white dark:bg-gray-950 transition-colors duration-300 relative">
      <Navbar 
        user={user} 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onLogout={handleLogout}
        onLoginClick={() => setShowLogin(true)}
        onProfileClick={() => setShowProfile(true)}
        locationName={userLocation.name}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onAddressClick={() => {
            if (user) setShowAddressSwitch(true);
            else setShowLogin(true);
        }}
        isVegMode={filterState.isVeg}
        onToggleVeg={() => setFilterState(prev => ({ ...prev, isVeg: !prev.isVeg }))}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Static Hero Banner */}
        <div className="mb-6 rounded-2xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg relative h-48 sm:h-64 flex items-center">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
            <div className="relative z-10 px-8 sm:px-12 w-full flex flex-col justify-center h-full">
                <h2 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter drop-shadow-md">
                    Want It? <br/> OrderEat.
                </h2>
                <p className="text-white/80 mt-2 font-medium max-w-md">Craving something delicious? We deliver happiness to your doorstep in minutes.</p>
            </div>
            <img 
                src="https://b.zmtcdn.com/web_assets/81f3ff974d82520780078ba1cfbd453a1583259680.png" 
                className="absolute -right-10 -bottom-10 h-64 sm:h-80 object-contain drop-shadow-xl hidden sm:block" 
                alt="Food Banner" 
            />
        </div>

        {/* Modern Multi-Announcement Carousel */}
        {banners.length > 0 && (
            <div className="mb-10 w-full relative group">
                {/* Carousel Viewport */}
                <div className="relative h-48 sm:h-56 overflow-hidden rounded-2xl shadow-lg">
                    {banners.map((banner, index) => {
                        const isActive = index === currentBannerIndex;
                        return (
                             <div 
                                key={banner.id || index}
                                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex justify-between items-center px-6 sm:px-10 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                                style={{ 
                                    background: `linear-gradient(to right, ${banner.gradientStart || '#9333ea'}, ${banner.gradientEnd || '#2563eb'})` 
                                }}
                            >
                                <div className={`relative z-10 text-white max-w-[70%] transition-transform duration-700 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                                    <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter mb-2 leading-none drop-shadow-md">{banner.text}</h2>
                                    {banner.subText && <p className="font-medium opacity-95 text-sm sm:text-base drop-shadow-sm">{banner.subText}</p>}
                                    <button 
                                        onClick={scrollToRestaurants} 
                                        className="mt-4 bg-white text-gray-900 px-5 py-2 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide shadow-lg hover:bg-gray-100 transition active:scale-95"
                                    >
                                        {banner.actionText || 'Order Now'}
                                    </button>
                                </div>
                                <div className={`relative z-10 opacity-20 hidden sm:block transition-transform duration-1000 ${isActive ? 'scale-100 rotate-0' : 'scale-50 rotate-45'}`}>
                                    <Sparkles className="w-24 h-24 text-white" />
                                </div>
                                
                                {/* Decorative Background Circles */}
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
                                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-black opacity-10 rounded-full blur-3xl"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Arrows (Visible on Hover/Desktop) */}
                {banners.length > 1 && (
                    <>
                        <button 
                            onClick={prevBanner}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 hidden sm:block"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={nextBanner}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 hidden sm:block"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {banners.map((_, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setCurrentBannerIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'w-6 bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Inspiration Section - Compact "Crave It? OrderEat" */}
        {loadingInspiration ? (
            <div className="mb-8 px-1">
               <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4 animate-pulse"></div>
               <div className="flex gap-4 overflow-hidden">
                  {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                          <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      </div>
                  ))}
               </div>
            </div>
        ) : inspirationItems.length > 0 && (
            <div className="mb-8 px-1">
               <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-4 tracking-tight">Crave It? OrderEat.</h3>
               <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {inspirationItems.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => setSearchQuery(item.name)}
                        className="group flex flex-col items-center gap-2 snap-start shrink-0 cursor-pointer"
                      >
                          <div className={`relative w-16 h-16 rounded-full overflow-hidden transition-all duration-300 ${searchQuery === item.name ? 'ring-2 ring-offset-2 ring-purple-600 dark:ring-offset-gray-950 scale-105 shadow-lg' : 'hover:scale-105 ring-1 ring-black/5 dark:ring-white/10'}`}>
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <span className={`text-[11px] font-bold text-center leading-tight transition-colors ${searchQuery === item.name ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                              {item.name}
                          </span>
                      </div>
                  ))}
               </div>
            </div>
        )}

        {/* Filter Bar */}
        <div className="sticky top-14 md:top-20 z-30 bg-white dark:bg-gray-950 py-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <button 
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${activeFiltersCount > 0 ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
                <SlidersHorizontal className="w-4 h-4" /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <button 
                onClick={() => setFilterState(prev => ({ ...prev, rating: prev.rating ? null : 4.0 }))}
                className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${filterState.rating ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
                Rating: 4.0+ {filterState.rating && <Check className="w-3.5 h-3.5" />}
            </button>
             <button 
                onClick={() => setFilterState(prev => ({ ...prev, hasOffers: !prev.hasOffers }))}
                className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${filterState.hasOffers ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
                Offers {filterState.hasOffers && <Check className="w-3.5 h-3.5" />}
            </button>
            
            {(activeFiltersCount > 0 || searchQuery) && (
                <button 
                    onClick={() => {
                        setFilterState({ sortBy: 'Relevance', rating: null, isVeg: false, hasOffers: false, costRange: null, cuisines: [], deliveryTimeMax: undefined });
                        setSearchQuery('');
                    }}
                    className="ml-auto text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline whitespace-nowrap"
                >
                    Clear All
                </button>
            )}
        </div>

        <div className="mb-6" ref={restaurantsRef}>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
                {searchQuery ? `Searching "${searchQuery}" in` : 'Restaurants near'} {userLocation.name.split(',')[1] || 'you'}
            </h3>
            
            {loadingRestaurants ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
                    ))}
                 </div>
            ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
                    <p className="text-gray-400 text-lg mb-2">No restaurants found matching criteria.</p>
                    <button onClick={() => {
                        setFilterState({ sortBy: 'Relevance', rating: null, isVeg: false, hasOffers: false, costRange: null, cuisines: [], deliveryTimeMax: undefined });
                        setSearchQuery('');
                    }} className="text-purple-600 font-bold hover:underline">Clear Filters</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                    {filteredRestaurants.map(r => (
                        <RestaurantCard 
                            key={r.id} 
                            restaurant={r} 
                            onClick={setSelectedRestaurant} 
                            offers={coupons.filter(c => c.restaurantId === r.id)}
                        />
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* --- ENHANCED LIVE ORDER POPUP --- */}
      {activeOrder && (
          <div 
            onClick={() => setShowOrders(true)}
            className="fixed bottom-6 right-6 z-40 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-sm w-full animate-in slide-in-from-bottom duration-500 overflow-hidden cursor-pointer hover:shadow-purple-500/20 transition-all"
          >
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: getProgress(activeOrder.status) }}
                  ></div>
              </div>
              
              <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <h4 className="font-black text-gray-800 dark:text-gray-100 text-lg tracking-tight">Live Order</h4>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Arriving in ~25 mins</p>
                      </div>
                      <div className="text-right">
                          <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                              {activeOrder.status}
                          </span>
                      </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl mb-3">
                      <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                          <CookingPot className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{activeOrder.restaurantName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activeOrder.items.length} Items • ₹{activeOrder.totalAmount}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                         <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                  </div>
                  
                  {/* Cancel Button - Only for early stages */}
                  {(activeOrder.status === 'PLACED' || activeOrder.status === 'CONFIRMED' || activeOrder.status === 'PREPARING') && (
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelLiveOrder(activeOrder.id);
                        }}
                        className="w-full text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                      >
                          <Ban className="w-3.5 h-3.5" /> Cancel Order
                      </button>
                  )}
              </div>
          </div>
      )}

      {selectedRestaurant && (
        <MenuModal 
          restaurant={selectedRestaurant} 
          onClose={() => setSelectedRestaurant(null)}
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onOpenCart={() => setIsCartOpen(true)}
          offers={coupons.filter(c => c.restaurantId === selectedRestaurant.id)}
        />
      )}

      <CartSheet 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onPlaceOrder={handlePlaceOrder}
        totalAmount={cartTotal}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={(id) => handleRemoveFromCart(id)}
        onAddressSelect={handleAddressSelect}
        user={user}
        adminSettings={adminSettings}
        deliveryDistance={cartDeliveryDistance}
        userOrderCount={userOrderCount}
        coupons={coupons}
      />
      
      {showAddressSwitch && user && (
          <AddressSwitchModal 
            user={user}
            currentLocationName={userLocation.name}
            onClose={() => setShowAddressSwitch(false)}
            onSelectAddress={handleAddressSelect}
            onAddNew={() => {
                setShowAddressSwitch(false);
                setShowProfile(true); 
            }}
          />
      )}

      {showOrders && user && (
          <OrdersModal 
            user={user} 
            onClose={() => setShowOrders(false)} 
            onReorder={handleReorder}
          />
      )}

      {showProfile && user && (
          <ProfileModal 
            user={user} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            onClose={() => setShowProfile(false)} 
            onLogout={handleLogout}
            onOpenOrders={() => { setShowProfile(false); setShowOrders(true); }}
          />
      )}
      
      <FilterModal 
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilters={filterState}
        onApply={setFilterState}
        availableCuisines={allCuisines}
      />

    </div>
  );
}

export default App;
