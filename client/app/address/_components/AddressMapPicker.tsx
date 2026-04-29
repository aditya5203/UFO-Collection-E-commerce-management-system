"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import type { FormState } from "./AddressModal";

type LatLng = {
  lat: number;
  lng: number;
};

export default function AddressMapPicker({
  form,
  mapCenter,
  markerPosition,
  mapLoaded,
  isLoaded,
  googleMapsApiKey,
  onUseCurrentLocation,
  onMarkerDragEnd,
  onMapLoad,
}: {
  form: FormState;
  mapCenter: LatLng;
  markerPosition: LatLng;
  mapLoaded: boolean;
  isLoaded: boolean;
  googleMapsApiKey: string;
  onUseCurrentLocation: () => void;
  onMarkerDragEnd: (e: google.maps.MapMouseEvent) => void;
  onMapLoad: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[#26293a] bg-[#161824] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-semibold text-white">
            Delivery location picker
          </h3>

          <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">
            Use current location or drag the marker to the exact delivery point.
          </p>
        </div>

        <button
          type="button"
          onClick={onUseCurrentLocation}
          className="inline-flex h-[40px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
        >
          Use Location
        </button>
      </div>

      {isLoaded && googleMapsApiKey ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                Latitude
              </div>
              <div className="mt-2 text-[15px] font-semibold text-white">
                {form.lat.toFixed(6)}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                Longitude
              </div>
              <div className="mt-2 text-[15px] font-semibold text-white">
                {form.lng.toFixed(6)}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[20px] border border-[#26293a]">
            <GoogleMap
              mapContainerStyle={{
                width: "100%",
                height: "340px",
              }}
              center={mapCenter}
              zoom={15}
              onLoad={onMapLoad}
              options={{
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                zoomControl: true,
              }}
            >
              <Marker
                position={markerPosition}
                draggable
                onDragEnd={onMarkerDragEnd}
              />
            </GoogleMap>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-8 text-center text-[14px] text-[#a7aec4]">
          {!googleMapsApiKey
            ? "Google Maps API key is missing."
            : "Loading Google Maps..."}
        </div>
      )}

      <div className="mt-4 rounded-[18px] border border-[#d6c7ff]/20 bg-[#d6c7ff]/10 px-4 py-3 text-[12px] leading-6 text-[#d6c7ff]">
        {mapLoaded
          ? "Tip: drag the pin to set the exact delivery location."
          : "Map is loading..."}
      </div>
    </div>
  );
}