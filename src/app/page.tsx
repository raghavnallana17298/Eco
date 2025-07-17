
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Recycle, Truck, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user is already logged in, redirect them to the dashboard.
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);
  
  // While checking auth state, we can show a loader or a blank screen.
  // For a landing page, it's often better to just show the page and let the redirect happen.
  // This avoids a flicker or loading state on the marketing page.
  if (loading || user) {
    return null; // Or a loading spinner if you prefer
  }

  const features = [
    "Digital waste requests",
    "Nearby recycler matching",
    "Order & history management",
    "Transport logistics integration",
    "Real-time notifications",
    "Waste material photo uploads",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Recycle className="h-6 w-6 text-accent animate-slow-spin" />
            <span className="text-lg font-bold font-headline">
              Eco<span className="text-primary">Nexus</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Join Now</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Bridging Industries &amp; Recycling
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Our platform connects small-scale industries, recycling plants, and transport providers to ensure efficient recycling and reduce waste for a greener future.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login">Join Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* User Segmentation Section */}
        <section id="roles" className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Who Is It For?</h2>
              <p className="mt-3 text-lg text-muted-foreground">A unified platform for every stakeholder in the recycling chain.</p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="flex flex-col text-center items-center">
                <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground mb-4">
                    <Package className="h-8 w-8 animate-float" />
                  </div>
                  <CardTitle className="text-2xl">For Industrialists</CardTitle>
                  <CardDescription>Raise waste pickup requests in minutes and find certified recyclers near you.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow"/>
                <div className="p-6 pt-0">
                   <Button variant="outline" asChild>
                    <Link href="/login">Get Started</Link>
                  </Button>
                </div>
              </Card>
              <Card className="flex flex-col text-center items-center">
                <CardHeader>
                   <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground mb-4">
                    <Recycle className="h-8 w-8 animate-float" />
                  </div>
                  <CardTitle className="text-2xl">For Recycling Plants</CardTitle>
                  <CardDescription>Accept waste orders, manage your inventory of recycled materials, and grow your business.</CardDescription>
                </CardHeader>
                 <CardContent className="flex-grow"/>
                <div className="p-6 pt-0">
                   <Button variant="outline" asChild>
                    <Link href="/login">Get Started</Link>
                  </Button>
                </div>
              </Card>
              <Card className="flex flex-col text-center items-center">
                <CardHeader>
                   <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground mb-4">
                    <Truck className="h-8 w-8 animate-float" />
                  </div>
                  <CardTitle className="text-2xl">For Transporters</CardTitle>
                  <CardDescription>Find and take up transport jobs for waste pickup and delivery with optimized routes.</CardDescription>
                </CardHeader>
                 <CardContent className="flex-grow"/>
                <div className="p-6 pt-0">
                  <Button variant="outline" asChild>
                    <Link href="/login">Get Started</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Highlight Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform Features</h2>
              <p className="text-lg text-muted-foreground">Everything you need to manage the recycling process efficiently and transparently.</p>
              <ul className="mt-6 space-y-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-accent" />
                    <span className="text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <img
                src="https://placehold.co/600x400.png"
                alt="Hands holding a globe with recycling symbols"
                data-ai-hint="earth recycling"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Econexus. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">About</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Contact</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
