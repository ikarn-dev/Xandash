'use client';

import { useState, useEffect, useRef } from 'react';

interface NodeLocationMapProps {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

export const NodeLocationMap = ({ lat, lon }: NodeLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('leaflet').then(leaflet => setL(leaflet.default));
  }, []);

  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 5,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="width:20px;height:20px;background:radial-gradient(circle,rgba(16,185,129,1) 0%,rgba(16,185,129,0.6) 70%);border:2px solid rgba(255,255,255,0.8);border-radius:50%;box-shadow:0 0 15px rgba(16,185,129,0.8);"></div>`,
      className: 'custom-node-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([lat, lon], { icon: customIcon }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, L, lat, lon]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full min-h-[180px] bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white/60 text-sm">Loading map...</div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full min-h-[180px] rounded-lg overflow-hidden relative z-10" />;
};
