"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { Recycle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal } from "lucide-react";

type MapViewProps = {
  center?: { lat: number; lng: number };
  markers?: { lat: number; lng: number; key: string }[];
};

export function MapView({ center = { lat: 51.5072, lng: -0.1276 }, markers = [] }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Map Unavailable</AlertTitle>
        <AlertDescription>
           The Google Maps API key is missing. Please add it to your environment variables to enable this feature.
        </AlertDescription>
      </Alert>
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
