
import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin } from 'lucide-react';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, addressParts: { area: string, house: string, landmark: string, fullAddress: string }) => void;
  height?: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({ initialLat = 28.6139, initialLng = 77.2090, onLocationSelect, height = "100%" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const initialPos = { lat: initialLat, lng: initialLng };
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy" // Better for mobile touch
    });

    const markerInstance = new window.google.maps.Marker({
      position: initialPos,
      map: mapInstance,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    setMap(mapInstance);
    setMarker(markerInstance);

    // Event Listener for Drag End
    markerInstance.addListener("dragend", () => {
        const position = markerInstance.getPosition();
        if(position) {
            handleGeocode(position.lat(), position.lng());
        }
    });
    
    // Initial Geocode
    handleGeocode(initialLat, initialLng);

  }, []);

  const handleGeocode = (lat: number, lng: number) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
              const addressComponents = results[0].address_components;
              let area = '';
              let house = '';
              let landmark = '';
              
              // Extract logic similar to common Indian addresses
              addressComponents.forEach((component: any) => {
                  if (component.types.includes("sublocality") || component.types.includes("neighborhood")) {
                      area = component.long_name;
                  }
                  if (component.types.includes("premise") || component.types.includes("street_number")) {
                      house = component.long_name;
                  }
                  if (component.types.includes("point_of_interest") || component.types.includes("landmark")) {
                      landmark = component.long_name;
                  }
              });

              if (!area) area = results[0].formatted_address.split(',')[1]?.trim() || results[0].formatted_address;
              
              onLocationSelect(lat, lng, {
                  area,
                  house,
                  landmark,
                  fullAddress: results[0].formatted_address
              });
          }
      });
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
            if (map && marker) {
                const pos = new window.google.maps.LatLng(latitude, longitude);
                map.setCenter(pos);
                marker.setPosition(pos);
                map.setZoom(17);
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
        <div ref={mapRef} className="w-full h-full" />
        
        <button 
            onClick={handleCurrentLocation}
            className="absolute bottom-4 right-4 bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 p-3 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:scale-105 transition active:scale-95"
            title="Use Current Location"
        >
            {loading ? (
                 <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                 <Navigation className="w-5 h-5 fill-current" />
            )}
        </button>
        
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-gray-200 dark:border-gray-700 pointer-events-none flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            Drag pin to adjust location
        </div>
    </div>
  );
};
