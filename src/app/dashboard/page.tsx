"use client";

import { useAuth } from "@/contexts/auth-context";
import { IndustrialistView } from "@/components/dashboard/industrialist-view";
import { RecyclerView } from "@/components/dashboard/recycler-view";
import { TransporterView } from "@/components/dashboard/transporter-view";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userProfile?.role) {
      case "Industrialist":
        return <IndustrialistView />;
      case "Recycler":
        return <RecyclerView />;
      case "Transporter":
        return <TransporterView />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                Your user role could not be determined. Please contact support.
              </CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Welcome, {userProfile?.displayName || "User"}!
      </h1>
      {renderDashboard()}
    </div>
  );
}
