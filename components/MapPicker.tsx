
import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin } from 'lucide-react';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, addressParts: { area: string, house: string, landmark: string, fullAddress: string }) => void;
  height?: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({ initialLat = 28.6139, initialLng = 77.2090, onLocationSelect, height = "100%" }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // Leaflet Map Instance
  const markerRef = useRef<any>(null); // Leaflet Marker Instance
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    // Prevent re-initialization
    if (mapRef.current) return;

    // 1. Initialize Map
    const map = window.L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
    mapRef.current = map;

    // 2. Add OpenStreetMap Tile Layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 3. Fix Marker Icon (Common Leaflet Issue)
    const icon = window.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // 4. Add Draggable Marker
    const marker = window.L.marker([initialLat, initialLng], {
        draggable: true,
        icon: icon
    }).addTo(map);
    markerRef.current = marker;

    // 5. Handle Drag End
    marker.on('dragend', function(event: any) {
        const position = marker.getLatLng();
        handleGeocode(position.lat, position.lng);
    });

    // Initial Geocode to trigger address update
    handleGeocode(initialLat, initialLng);

    // Cleanup on unmount
    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, []);

  const handleGeocode = async (lat: number, lng: number) => {
      try {
          // Use OpenStreetMap Nominatim API for Reverse Geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: {
                  'User-Agent': 'OrderEat-FoodDeliveryApp/1.0'
              }
          });
          const data = await response.json();
          
          if (data && data.address) {
              const addr = data.address;
              
              const area = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.city || '';
              const house = addr.house_number || addr.building || '';
              const landmark = addr.amenity || addr.shop || addr.tourism || '';
              
              onLocationSelect(lat, lng, {
                  area,
                  house,
                  landmark,
                  fullAddress: data.display_name
              });
          }
      } catch (error) {
          console.error("Geocoding failed", error);
      }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            if (mapRef.current && markerRef.current) {
                const newLatLng = new window.L.LatLng(latitude, longitude);
                mapRef.current.setView(newLatLng, 17);
                markerRef.current.setLatLng(newLatLng);
                handleGeocode(latitude, longitude);
            }
            setLoading(false);
        },
        (error) => {
            console.error("Error getting location", error);
            alert("Unable to retrieve your location.");
            setLoading(false);
        },
        { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        <button 
            onClick={handleCurrentLocation}
            className="absolute bottom-4 right-4 z-[400] bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 p-3 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-105 transition active:scale-95"
            title="Use Current Location"
        >
            {loading ? (
                 <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                 <Navigation className="w-5 h-5 fill-current" />
            )}
        </button>
        
        <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-gray-200 dark:border-gray-700 pointer-events-none flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            Drag pin to adjust location
        </div>
    </div>
  );
};