
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserProfile } from "@/lib/types";
import { Building, Mail, MapPin } from "lucide-react";

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
      <CardContent className="space-y-2 text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
