
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Loader2, MapPin, Search, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import type { UserProfile, WasteRequest } from "@/lib/types";
import { RecyclerCard } from "@/components/recycler-card";
import { TransporterCard } from "@/components/transporter-card";

const wasteRequestSchema = z.object({
  type: z.string().min(1, "Waste type is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  image: z.any().optional(),
  notes: z.string().optional(),
});

export function IndustrialistView() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recyclers, setRecyclers] = useState<UserProfile[]>([]);
  const [transporters, setTransporters] = useState<UserProfile[]>([]);
  const [isFetchingRecyclers, setIsFetchingRecyclers] = useState(true);
  const [isFetchingTransporters, setIsFetchingTransporters] = useState(true);
  const [myRequests, setMyRequests] = useState<WasteRequest[]>([]);
  const [isFetchingRequests, setIsFetchingRequests] = useState(true);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof wasteRequestSchema>>({
    resolver: zodResolver(wasteRequestSchema),
    defaultValues: {
      type: "",
      quantity: 0,
      notes: "",
    },
  });

  const fetchUsersByRole = async (role: "Recycler" | "Transporter", setter: React.Dispatch<React.SetStateAction<UserProfile[]>>, loadingSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    loadingSetter(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", role));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setter(usersData);
    } catch (error) {
      console.error(`Error fetching ${role}s:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not fetch available ${role}s.`
      });
    } finally {
      loadingSetter(false);
    }
  };

  // Fetch all Recyclers
  useEffect(() => {
    fetchUsersByRole("Recycler", setRecyclers, setIsFetchingRecyclers);
  }, []);

  // Fetch all Transporters
  useEffect(() => {
    fetchUsersByRole("Transporter", setTransporters, setIsFetchingTransporters);
  }, []);

  // Fetch Industrialist's own requests
  useEffect(() => {
    if (!user) return;

    setIsFetchingRequests(true);
    const requestsRef = collection(db, "wasteRequests");
    const q = query(requestsRef, where("industrialistId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteRequest));
      requestsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyRequests(requestsData);
      setIsFetchingRequests(false);
    }, (error) => {
      console.error("Error fetching waste requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch your waste requests."
      });
      setIsFetchingRequests(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  if (!userProfile?.location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to EcoNexus!</CardTitle>
          <CardDescription>To get started, please set your location.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>Location Required</AlertTitle>
            <AlertDescription>
              You need to set your location to find nearby recyclers and create waste requests.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-4">
            <Link href="/dashboard/profile">Set My Location</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: z.infer<typeof wasteRequestSchema>) {
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit a request."});
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "wasteRequests"), {
        industrialistId: user.uid,
        industrialistName: userProfile.displayName,
        industrialistLocation: userProfile.location,
        type: values.type,
        quantity: values.quantity,
        notes: values.notes,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Request Submitted!",
        description: "Your waste pickup request has been sent to nearby facilities.",
      });
      form.reset();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not submit your request. " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const statusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-transit': return 'secondary';
      case 'accepted': return 'outline';
      case 'pending': return 'destructive';
      default: return 'secondary';
    }
  }

  return (
    <Tabs defaultValue="new-request">
      <TabsList className="grid w-full grid-cols-4 md:w-[800px]">
        <TabsTrigger value="new-request">New Request</TabsTrigger>
        <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        <TabsTrigger value="find-recyclers">Find Recyclers</TabsTrigger>
        <TabsTrigger value="find-transporters">Find Transporters</TabsTrigger>
      </TabsList>

      <TabsContent value="new-request">
        <Card>
          <CardHeader>
            <CardTitle>Submit a Waste Pickup Request</CardTitle>
            <CardDescription>Fill out the form below to schedule a pickup. This will be visible to recyclers in your area.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Waste</FormLabel>
                      <FormControl><Input placeholder="e.g., Plastic, Cardboard, Scrap Metal" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (in kg)</FormLabel>
                      <FormControl><Input type="number" placeholder="500" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl><Textarea placeholder="Any special instructions for the transporter or recycler..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormItem>
                    <FormLabel>Photo of Waste (optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or GIF (MAX. 5MB)</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" />
                        </label>
                      </div> 
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="my-requests">
        <Card>
          <CardHeader>
            <CardTitle>My Waste Requests</CardTitle>
            <CardDescription>Here is a list of your past and current waste pickup requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Waste Type</TableHead>
                    <TableHead>Quantity (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accepted By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(request.status)} className="capitalize">{request.status}</Badge>
                      </TableCell>
                      <TableCell>{request.recyclerName || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <Alert variant="default">
                <Search className="h-4 w-4" />
                <AlertTitle>No Requests Found</AlertTitle>
                <AlertDescription>
                  You haven't submitted any waste requests yet. Go to the "New Request" tab to create one.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="find-recyclers">
        <Card>
          <CardHeader>
            <CardTitle>All Registered Recycling Plants</CardTitle>
            <CardDescription>
             Browse all available recycling plants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingRecyclers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Searching for recyclers...</p>
              </div>
            ) : recyclers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recyclers.map(recycler => (
                  <RecyclerCard key={recycler.uid} recycler={recycler} />
                ))}
              </div>
            ) : (
              <Alert variant="default">
                <Search className="h-4 w-4" />
                <AlertTitle>No Recyclers Found</AlertTitle>
                <AlertDescription>
                  There are currently no registered recycling plants.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="find-transporters">
        <Card>
          <CardHeader>
            <CardTitle>All Registered Transporters</CardTitle>
            <CardDescription>
             Browse all available transport providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingTransporters ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Searching for transporters...</p>
              </div>
            ) : transporters.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {transporters.map(transporter => (
                  <TransporterCard key={transporter.uid} transporter={transporter} />
                ))}
              </div>
            ) : (
              <Alert variant="default">
                <Truck className="h-4 w-4" />
                <AlertTitle>No Transporters Found</AlertTitle>
                <AlertDescription>
                  There are currently no registered transport providers.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
