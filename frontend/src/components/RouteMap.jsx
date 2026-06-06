import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons issue in React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icons for different marker types
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const attractionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: markerShadow,
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -30],
  shadowSize: [33, 33]
});

// Component to dynamically fit map boundaries to include all markers
const MapBoundsController = ({ userCoords, destCoords, attractions }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = [];
    if (userCoords) bounds.push([userCoords.latitude, userCoords.longitude]);
    if (destCoords) bounds.push([destCoords.latitude, destCoords.longitude]);
    
    if (attractions && attractions.length > 0) {
      attractions.forEach(attr => {
        if (attr.latitude && attr.longitude) {
          bounds.push([attr.latitude, attr.longitude]);
        }
      });
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
    }
  }, [map, userCoords, destCoords, attractions]);

  return null;
};

const RouteMap = ({ userCoords, destCoords, destinationName, nearbyAttractions }) => {
  const defaultCenter = [20.5937, 78.9629]; // Center of India
  const defaultZoom = 5;

  const destLat = destCoords?.latitude || defaultCenter[0];
  const destLng = destCoords?.longitude || defaultCenter[1];

  // Mock nearby attraction locations geographically distributed within 2-10km of destination
  const mappedAttractions = nearbyAttractions.map((name, index) => {
    // Generate small deterministic offsets
    const latOffset = (Math.sin(index * 2) * 0.02) + 0.01;
    const lngOffset = (Math.cos(index * 2) * 0.02) + 0.01;
    return {
      name,
      latitude: destLat + latOffset,
      longitude: destLng + lngOffset
    };
  });

  const hasUserCoords = userCoords && userCoords.latitude && userCoords.longitude;

  return (
    <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-inner border border-slate-200/50 relative z-10">
      <MapContainer 
        center={hasUserCoords ? [userCoords.latitude, userCoords.longitude] : [destLat, destLng]} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Marker */}
        {hasUserCoords && (
          <Marker position={[userCoords.latitude, userCoords.longitude]} icon={userIcon}>
            <Popup>
              <div className="text-left font-sans">
                <span className="font-bold text-xs text-indigo-600 block">Your Current Location</span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Start point for planning</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        <Marker position={[destLat, destLng]} icon={destinationIcon}>
          <Popup>
            <div className="text-left font-sans">
              <span className="font-bold text-xs text-slate-800 block">{destinationName}</span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Target Destination</span>
            </div>
          </Popup>
        </Marker>

        {/* Nearby Attractions Markers */}
        {mappedAttractions.map((attr, idx) => (
          <Marker key={idx} position={[attr.latitude, attr.longitude]} icon={attractionIcon}>
            <Popup>
              <div className="text-left font-sans">
                <span className="font-bold text-xs text-slate-800 block">{attr.name}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Nearby Point of Interest</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Polyline Route */}
        {hasUserCoords && (
          <Polyline 
            positions={[
              [userCoords.latitude, userCoords.longitude],
              [destLat, destLng]
            ]} 
            color="#4F46E5" 
            weight={4}
            dashArray="8, 8"
          />
        )}

        {/* Map Center & Boundary Controller */}
        <MapBoundsController 
          userCoords={userCoords} 
          destCoords={destCoords} 
          attractions={mappedAttractions} 
        />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
