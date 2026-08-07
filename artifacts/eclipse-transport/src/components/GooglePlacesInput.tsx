import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
    _initGoogleMaps?: () => void;
  }
}

let _mapsLoaded = false;
let _mapsLoading = false;
const _mapsQueue: (() => void)[] = [];

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (_mapsLoaded) { resolve(); return; }
    _mapsQueue.push(resolve);
    if (_mapsLoading) return;
    _mapsLoading = true;
    window._initGoogleMaps = () => {
      _mapsLoaded = true;
      _mapsQueue.forEach((cb) => cb());
      _mapsQueue.length = 0;
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=_initGoogleMaps`;
    script.async = true;
    document.head.appendChild(script);
  });
}

interface GooglePlacesInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: GooglePlaceSelection | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export interface GooglePlaceSelection {
  address: string;
  lat: number;
  lng: number;
}

// Greater Los Angeles service area bounds
// SW: Malibu / Palos Verdes  →  NE: San Bernardino border / Antelope Valley
const LA_BOUNDS = {
  sw: { lat: 33.50, lng: -118.95 },
  ne: { lat: 34.82, lng: -117.50 },
};

export function GooglePlacesInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter location",
  className = "",
  id,
}: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(_mapsLoaded);

  useEffect(() => {
    if (inputRef.current && value !== undefined) {
      inputRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!apiKey) return;
    loadGoogleMapsScript(apiKey).then(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!isReady || !inputRef.current || autocompleteRef.current) return;

    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(LA_BOUNDS.sw.lat, LA_BOUNDS.sw.lng),
      new window.google.maps.LatLng(LA_BOUNDS.ne.lat, LA_BOUNDS.ne.lng)
    );

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      bounds,
      strictBounds: false,          // bias toward LA but don't block other input
      componentRestrictions: { country: "us" },
    });
    autocompleteRef.current = ac;

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const address = place?.formatted_address || place?.name || "";
      const location = place?.geometry?.location;
      if (address && location) {
        onChange(address);
        onPlaceSelect?.({
          address,
          lat: location.lat(),
          lng: location.lng(),
        });
      }
    });
  }, [isReady, onChange, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      defaultValue={value}
      onInput={() => onPlaceSelect?.(null)}
      onBlur={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={`flex w-full rounded-xl border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    />
  );
}
