'use client';

import { useEffect, useRef, useState } from 'react';

export default function NodeLocationMap({ lat, lon }: { lat: number; lon: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstance.current) return;

      const map = L.default.map(mapRef.current, {
        center: [lat, lon],
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      L.default.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
      }).addTo(map);

      const icon = L.default.divIcon({
        html: '<div style="width:16px;height:16px;background:#10b981;border:2px solid white;border-radius:50%;box-shadow:0 0 10px #10b981"></div>',
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.default.marker([lat, lon], { icon }).addTo(map);
      mapInstance.current = map;
      setReady(true);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lon]);

  return (
    <div className="relative h-[180px]">
      {!ready && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white/40 text-sm">
          Loading map...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
