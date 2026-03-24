import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  placeholder: string;
  onSelect: (location: { lat: number, lng: number, address: string }) => void;
  className?: string;
}

export default function LocationSearch({ placeholder, onSelect, className = '' }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSuggestions = async () => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setShowDropdown(false);
    }, 10000);

    try {
      // Nominatim API for open-source geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ng&limit=5`,
        {
          headers: {
            'User-Agent': 'RushNG-App/1.0'
          }
        }
      );
      const data = await response.json();
      clearTimeout(timeoutId);
      setSuggestions(data);
      setShowDropdown(true);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.display_name);
    setShowDropdown(false);
    onSelect({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute top-4 left-4 h-5 w-5 text-white/20" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-carbon bg-white/5 py-4 pr-12 pl-12 text-sm text-cream placeholder:text-white/20 focus:border-rush-orange focus:outline-none"
        />
        {loading && (
          <Loader2 className="absolute top-4 right-4 h-5 w-5 animate-spin text-rush-orange" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-[1000] mt-2 w-full overflow-hidden rounded-xl border border-carbon bg-midnight shadow-2xl backdrop-blur-xl"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="flex w-full items-start gap-3 border-b border-carbon p-4 text-left transition-colors hover:bg-white/5 last:border-0"
            >
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-rush-orange" />
              <span className="text-xs text-white/60 line-clamp-2">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
