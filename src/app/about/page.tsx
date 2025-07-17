
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Recycle, Target, Handshake, Leaf } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Recycle className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold font-headline">
              Eco<span className="text-primary">Nexus</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
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
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl font-headline">
                About EcoNexus
              </h1>
              <p className="mx-auto mt-4 max-w-[800px] text-md text-muted-foreground md:text-lg">
                We are on a mission to revolutionize the recycling industry by creating seamless connections between waste producers, recyclers, and transporters.
              </p>
            </div>
            
            <div className="mt-12 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <img
                  src="https://placehold.co/600x500.png"
                  alt="Globe with recycling symbol"
                  data-ai-hint="earth recycling"
                  className="rounded-lg shadow-xl"
                />
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Target className="h-10 w-10 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold">Our Mission</h3>
                    <p className="text-muted-foreground mt-2">
                      To build a comprehensive digital ecosystem that streamlines the recycling supply chain, making it more efficient, transparent, and profitable for all stakeholders. We aim to reduce industrial waste by making recycling an easy and accessible option for businesses of all sizes.
                    </p>
                  </div>
                </div>
                 <div className="flex gap-4">
                  <Handshake className="h-10 w-10 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold">Our Vision</h3>
                    <p className="text-muted-foreground mt-2">
                      We envision a world where industrial waste is minimized and recycling is maximized, contributing to a circular economy and a healthier planet. EcoNexus strives to be the central nervous system for the recycling industry, fostering collaboration and innovation.
                    </p>
                  </div>
                </div>
                 <div className="flex gap-4">
                  <Leaf className="h-10 w-10 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold">Our Values</h3>
                    <p className="text-muted-foreground mt-2">
                      Sustainability, efficiency, and collaboration are at the core of everything we do. We believe that technology can be a powerful force for positive environmental change, and we are committed to building a platform that serves both our users and the planet.
                    </p>
                  </div>
                </div>
              </div>
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
