
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { UserProfile } from "@/lib/types";
import { Building, Mail, MapPin, Package, User, MessageSquare } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { startConversation } from "@/lib/actions";
import { useAuth } from "@/contexts/auth-context";

type RecyclerCardProps = {
  recycler: UserProfile;
};

export function RecyclerCard({ recycler }: RecyclerCardProps) {
  const { user } = useAuth();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="text-accent" />
          {recycler.plantName || recycler.displayName || "Recycling Plant"}
        </CardTitle>
        <CardDescription>Recycling Facility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm flex-grow">
        <div className="space-y-2 text-muted-foreground">
          {recycler.displayName && (
            <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Owner: {recycler.displayName}</span>
            </div>
          )}
          {recycler.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{recycler.location}</span>
            </div>
          )}
          {recycler.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${recycler.email}`} className="hover:text-primary transition-colors truncate">
                {recycler.email}
              </a>
            </div>
          )}
        </div>
        
        {recycler.materials && recycler.materials.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-foreground mb-2">
              <Package className="h-4 w-4" />
              Accepts:
            </h4>
            <div className="flex flex-wrap gap-2">
              {recycler.materials.map(material => (
                <Badge key={material} variant="outline">{material}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <form action={startConversation}>
            <input type="hidden" name="senderId" value={user?.uid} />
            <input type="hidden" name="recipientId" value={recycler.uid} />
            <Button type="submit" variant="outline" className="w-full" disabled={!user}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
