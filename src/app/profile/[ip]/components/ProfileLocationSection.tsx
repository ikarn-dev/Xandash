import { getCountryFlagUrl } from '@/libs/services/geolocation';
import { MapPinIcon, GlobeIcon } from './ProfileIcons';
import { NodeLocationMap } from './NodeLocationMap';
import { LocationData, CurrentNodeData } from './types';

interface ProfileLocationSectionProps {
  location: LocationData | null;
  node: CurrentNodeData | null;
}

export const ProfileLocationSection = ({ location, node }: ProfileLocationSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Map */}
      <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-lg overflow-hidden relative z-0">
        <div className="p-3 border-b border-white/10 flex items-center gap-2 relative z-20">
          <MapPinIcon className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Node Location</h2>
        </div>
        <div className="h-[160px] sm:h-[180px] relative z-10">
          {location?.lat && location?.lon ? (
            <NodeLocationMap 
              lat={location.lat} 
              lon={location.lon} 
              city={location.city} 
              country={location.country} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/40 text-sm">
              Location unavailable
            </div>
          )}
        </div>
      </div>
      
      {/* Location Details */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <GlobeIcon className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Location Details</h2>
        </div>
        <div className="space-y-2 text-sm">
          {location?.country_code && (
            <img 
              src={getCountryFlagUrl(location.country_code)} 
              alt={location.country} 
              className="w-6 h-4 object-cover rounded mb-2" 
            />
          )}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-white/60 flex-shrink-0">Country</span>
            <span className="text-white break-words text-right sm:text-left">
              {location?.country || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-white/60 flex-shrink-0">City</span>
            <span className="text-white break-words text-right sm:text-left">
              {location?.city || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-white/60 flex-shrink-0">Provider</span>
            <span className="text-white text-xs break-words text-right sm:text-left">
              {location?.provider || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-white/60 flex-shrink-0">RPC Port</span>
            <span className="text-white font-mono text-right sm:text-left">
              {node?.rpc_port || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
