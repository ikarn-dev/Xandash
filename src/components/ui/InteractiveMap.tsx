'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface ValidatorLocation {
  id: string;
  lat: number;
  lng: number;
  count: number;
  city?: string;
  country?: string;
}

interface InteractiveMapProps {
  validators: ValidatorLocation[];
  className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ validators, className = "" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const regionLayersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import Leaflet and its CSS only on client side
    const loadLeaflet = async () => {
      // Load CSS via link tag to avoid TypeScript issues
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      const leaflet = await import('leaflet');
      setL(leaflet.default);
    };
    
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [20, 0], // Center of the world
      zoom: 2,
      minZoom: 1,
      maxZoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: true,
      dragging: true,
      touchZoom: true,
      attributionControl: false,
    });

    // Add dark tile layer
    const mapTilesUrl = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(mapTilesUrl, {
      attribution: '',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, L]);

  useEffect(() => {
    if (!isClient || !L || !mapInstanceRef.current) return;

    // Clear existing markers and regions
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    regionLayersRef.current.forEach(region => {
      mapInstanceRef.current?.removeLayer(region);
    });
    markersRef.current = [];
    regionLayersRef.current = [];

    // Add new markers
    validators.forEach(validator => {
      if (!mapInstanceRef.current) return;

      const size = Math.min(Math.max(16 + validator.count * 0.3, 20), 35);
      
      // Create region highlight circle (initially hidden)
      const regionHighlight = L.circle([validator.lat, validator.lng], {
        radius: 800000, // 800km radius
        fillColor: '#ffffff',
        fillOpacity: 0,
        color: '#ffffff',
        weight: 0,
        opacity: 0
      });
      
      const customIcon = L.divIcon({
        html: `
          <div class="validator-marker" style="
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(200, 200, 200, 1) 70%, rgba(150, 150, 150, 1) 100%);
            border: 1.5px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: black;
            font-weight: bold;
            font-size: ${Math.max(9, size * 0.35)}px;
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            z-index: 20;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
          ">${validator.count}</div>
        `,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([validator.lat, validator.lng], {
        icon: customIcon,
        zIndexOffset: 100
      });

      // Add hover tooltip
      const tooltipContent = `
        <div style="
          background: rgba(0, 0, 0, 0.95);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="font-weight: bold; margin-bottom: 4px; color: white; font-size: 13px;">
            ${validator.city && validator.country 
              ? `${validator.city}, ${validator.country}`
              : `Location ${validator.id}`
            }
          </div>
          <div style="margin-bottom: 2px; font-size: 12px;">
            <span style="color: white; font-weight: bold;">${validator.count}</span> 
            pNode${validator.count !== 1 ? 's' : ''}
          </div>
          <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px;">
            ${validator.lat.toFixed(4)}°, ${validator.lng.toFixed(4)}°
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
        offset: [0, -15],
        className: 'custom-tooltip',
        opacity: 1
      });

      // Add hover events for region highlighting
      marker.on('mouseover', () => {
        regionHighlight.setStyle({
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.3
        });
      });

      marker.on('mouseout', () => {
        regionHighlight.setStyle({
          fillOpacity: 0,
          weight: 0,
          opacity: 0
        });
      });

      regionHighlight.addTo(mapInstanceRef.current);
      marker.addTo(mapInstanceRef.current);
      
      regionLayersRef.current.push(regionHighlight);
      markersRef.current.push(marker);
    });
  }, [validators, isClient, L]);

  // Show loading state while Leaflet is loading
  if (!isClient || !L) {
    return (
      <div className={`relative w-full h-full min-h-[400px] ${className}`}>
        <div className="w-full h-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center" style={{ minHeight: '400px' }}>
          <div className="text-white/60 text-sm">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px', zIndex: 1 }}
      />
      <style jsx global>{`
        .leaflet-tooltip.custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          z-index: 20 !important;
        }
        .leaflet-tooltip.custom-tooltip::before {
          display: none !important;
        }
        .leaflet-container {
          background: #111827 !important;
          z-index: 1 !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
          z-index: 20 !important;
        }
        .leaflet-marker-pane {
          z-index: 20 !important;
        }
        .validator-marker:hover {
          transform: scale(1.15) !important;
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
          border-color: rgba(255, 255, 255, 1) !important;
        }
        .leaflet-tooltip-pane {
          z-index: 20 !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5) !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(0, 0, 0, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: white !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: rgba(0, 0, 0, 0.9) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.3) !important;
        }
        .leaflet-control-zoom a:first-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:last-child {
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-pane {
          z-index: 10 !important;
        }
        .leaflet-top, .leaflet-bottom {
          z-index: 20 !important;
        }
      `}</style>
    </div>
  );
};