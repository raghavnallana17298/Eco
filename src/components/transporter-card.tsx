
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserProfile } from "@/lib/types";
import { Mail, MapPin, Truck, User } from "lucide-react";

type TransporterCardProps = {
  transporter: UserProfile;
};

export function TransporterCard({ transporter }: TransporterCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="text-accent" />
          {transporter.displayName || "Transport Service"}
        </CardTitle>
        <CardDescription>Logistics Provider</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
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
              <a href={`mailto:${transporter.email}`} className="hover:text-primary transition-colors">
                {transporter.email}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
