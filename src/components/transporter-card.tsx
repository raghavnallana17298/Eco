
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { UserProfile } from "@/lib/types";
import { Mail, MapPin, Truck, User, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

type TransporterCardProps = {
  transporter: UserProfile;
};

export function TransporterCard({ transporter }: TransporterCardProps) {
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
      </CardContent>
      <Separator />
       <CardFooter className="p-4">
          <Button variant="outline" className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
      </CardFooter>
    </Card>
  );
}
