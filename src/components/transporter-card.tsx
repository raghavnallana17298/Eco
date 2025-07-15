
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { UserProfile } from "@/lib/types";
import { Mail, MapPin, Truck, User, MessageSquare, Car } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { startConversation } from "@/lib/actions";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "./ui/badge";


type TransporterCardProps = {
  transporter: UserProfile;
};

export function TransporterCard({ transporter }: TransporterCardProps) {
  const { user } = useAuth();
  
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="text-accent" />
          {transporter.displayName || "Transport Service"}
        </CardTitle>
        <CardDescription>Logistics Provider</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm flex-grow">
        <div className="space-y-2 text-muted-foreground">
          {transporter.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Operating Area: {transporter.location}</span>
            </div>
          )}
          {transporter.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${transporter.email}`} className="hover:text-primary transition-colors truncate">
                {transporter.email}
              </a>
            </div>
          )}
        </div>
         {transporter.vehicleTypes && transporter.vehicleTypes.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-foreground mb-2">
              <Car className="h-4 w-4" />
              Vehicle Types:
            </h4>
            <div className="flex flex-wrap gap-2">
              {transporter.vehicleTypes.map(vehicle => (
                <Badge key={vehicle} variant="outline">{vehicle}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <Separator />
       <CardFooter className="p-4">
          <form action={startConversation}>
            <input type="hidden" name="senderId" value={user?.uid} />
            <input type="hidden" name="recipientId" value={transporter.uid} />
            <Button type="submit" variant="outline" className="w-full" disabled={!user}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>
          </form>
      </CardFooter>
    </Card>
  );
}
