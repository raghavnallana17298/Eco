"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Recycle } from "lucide-react";

type MapViewProps = {
  center?: { lat: number; lng: number };
  markers?: { lat: number; lng: number; key: string }[];
};

export function MapView({ center = { lat: 51.5072, lng: -0.1276 }, markers = [] }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed bg-muted text-center p-4">
        <div>
          <h3 className="text-lg font-semibold">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            The Google Maps API key is missing. Please add <code className="bg-primary/20 text-primary-foreground p-1 rounded-sm text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[400px] w-full rounded-lg overflow-hidden border">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={9}
          mapId="ecoflow_map"
          gestureHandling={"greedy"}
        >
          {markers.map((marker) => (
            <AdvancedMarker key={marker.key} position={marker}>
               <Recycle className="h-6 w-6 text-accent" />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
