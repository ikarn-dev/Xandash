import { getCountryFlagUrl } from '@/libs/services/geolocation';
import { MapPinIcon, GlobeIcon } from './ProfileIcons';
import { NodeLocationMap } from './NodeLocationMap';
import { LocationData, CurrentNodeData } from './types';

interface ProfileLocationSectionProps {
  location: LocationData | null;
  node: CurrentNodeData | null;
}

// Corner accents for consistent styling
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2">
      <div className="absolute top-0 left-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute top-0 left-0 w-px h-1.5 bg-white/20"></div>
    </div>
    <div className="absolute top-0 right-0 w-2 h-2">
      <div className="absolute top-0 right-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute top-0 right-0 w-px h-1.5 bg-white/20"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-2 h-2">
      <div className="absolute bottom-0 left-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute bottom-0 left-0 w-px h-1.5 bg-white/20"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-2 h-2">
      <div className="absolute bottom-0 right-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute bottom-0 right-0 w-px h-1.5 bg-white/20"></div>
    </div>
  </>
);

export const ProfileLocationSection = ({ location, node }: ProfileLocationSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
      {/* Map */}
      <div className="lg:col-span-2 relative group bg-black border border-white/10 overflow-hidden hover:border-white/20 transition-colors z-0">
        <CornerAccents />
        <div className="p-2.5 sm:p-3 border-b border-white/10 flex items-center gap-2 relative z-20">
          <MapPinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <h2 className="text-xs sm:text-sm font-semibold text-white">Node Location</h2>
        </div>
        <div className="h-[140px] sm:h-[160px] lg:h-[180px] relative z-10">
          {location?.lat && location?.lon ? (
            <NodeLocationMap
              lat={location.lat}
              lon={location.lon}
              city={location.city}
              country={location.country}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/40 text-xs sm:text-sm">
              Location unavailable
            </div>
          )}
        </div>
      </div>

      {/* Location Details */}
      <div className="relative group bg-black border border-white/10 p-2.5 sm:p-3 hover:border-white/20 transition-colors">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <GlobeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          <h2 className="text-xs sm:text-sm font-semibold text-white">Location Details</h2>
        </div>
        <div className="space-y-2 text-xs sm:text-sm">
          {location?.country_code && (
            <img
              src={getCountryFlagUrl(location.country_code)}
              alt={location.country}
              className="w-5 h-3.5 sm:w-6 sm:h-4 object-cover mb-2"
            />
          )}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-1">
            <span className="text-white/60 flex-shrink-0 text-[10px] sm:text-xs">Country</span>
            <span className="text-white break-words text-right sm:text-left text-[10px] sm:text-xs">
              {location?.country || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-1">
            <span className="text-white/60 flex-shrink-0 text-[10px] sm:text-xs">City</span>
            <span className="text-white break-words text-right sm:text-left text-[10px] sm:text-xs">
              {location?.city || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-1">
            <span className="text-white/60 flex-shrink-0 text-[10px] sm:text-xs">Provider</span>
            <span className="text-white break-words text-right sm:text-left text-[10px] sm:text-xs truncate max-w-[150px]">
              {location?.provider || 'Unknown'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-1">
            <span className="text-white/60 flex-shrink-0 text-[10px] sm:text-xs">RPC Port</span>
            <span className="text-white font-mono text-right sm:text-left text-[10px] sm:text-xs">
              {node?.rpc_port || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
