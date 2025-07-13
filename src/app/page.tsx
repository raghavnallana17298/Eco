"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AuthForm } from "@/components/auth-form";
import { Loader2, Recycle } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center rounded-full bg-accent p-4">
            <Recycle className="h-10 w-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-bold font-headline text-foreground">
            Eco<span className="text-primary">Nexus</span>
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            Connecting waste producers with recyclers, efficiently.
          </p>
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
