
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserProfile } from "@/lib/types";
import { Building, Mail, MapPin, Package } from "lucide-react";
import { Badge } from "./ui/badge";

type RecyclerCardProps = {
  recycler: UserProfile;
};

export function RecyclerCard({ recycler }: RecyclerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="text-accent" />
          {recycler.displayName || "Recycling Plant"}
        </CardTitle>
        <CardDescription>Recycling Facility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2 text-muted-foreground">
          {recycler.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{recycler.location}</span>
            </div>
          )}
          {recycler.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${recycler.email}`} className="hover:text-primary transition-colors">
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
    </Card>
  );
}
