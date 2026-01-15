'use client';

import { useState, useEffect, useRef } from 'react';

interface MapNode {
  lat: number;
  lon: number;
  city?: string;
}

interface CountryMapProps {
  nodes: MapNode[];
  countryName: string;
}

export const CountryMap = ({ nodes, countryName }: CountryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    const loadLeaflet = async () => {
      // Ensure Leaflet CSS is loaded
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
        
        await new Promise((resolve) => {
          link.onload = resolve;
          link.onerror = resolve;
        });
      }
      
      const leaflet = await import('leaflet');
      setL(leaflet.default);
    };
    
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) return;
    if (nodes.length === 0) return;

    const avgLat = nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length;
    const avgLon = nodes.reduce((sum, n) => sum + n.lon, 0) / nodes.length;

    const map = L.map(mapRef.current, {
      center: [avgLat, avgLon],
      zoom: 4,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      attributionControl: false,
    });

    const mapTilesUrl = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(mapTilesUrl, {
      attribution: '',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    nodes.forEach((node) => {
      const customIcon = L.divIcon({
        html: `
          <div style="
            width: 16px;
            height: 16px;
            background: radial-gradient(circle, rgba(16, 185, 129, 1) 0%, rgba(16, 185, 129, 0.6) 70%);
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
          "></div>
        `,
        className: 'custom-node-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([node.lat, node.lon], { icon: customIcon });
      
      if (node.city) {
        marker.bindTooltip(`<div style="background: rgba(0,0,0,0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${node.city}</div>`, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'custom-tooltip',
        });
      }

      marker.addTo(map);
    });

    if (nodes.length > 1) {
      const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lon]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    mapInstanceRef.current = map;

    // Force map to recalculate its size
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, L, nodes, countryName]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full min-h-[250px] bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white/60 text-sm">Loading map...</div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full min-h-[250px] rounded-lg overflow-hidden" />
      <style jsx global>{`
        .leaflet-container { background: #111827 !important; }
        .custom-node-marker { background: transparent !important; border: none !important; }
        .leaflet-tooltip.custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip.custom-tooltip::before { display: none !important; }
      `}</style>
    </>
  );
};
