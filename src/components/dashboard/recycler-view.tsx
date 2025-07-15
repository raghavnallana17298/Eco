
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import type { WasteRequest, UserProfile, RecycledMaterial } from "@/lib/types";
import { Loader2, Search, MapPin, Truck, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { TransporterCard } from "../transporter-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

const recycledMaterialSchema = z.object({
  type: z.string().min(2, "Material type is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  price: z.coerce.number().min(0.01, "Price must be greater than 0."),
});

export function RecyclerView() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [incomingWaste, setIncomingWaste] = useState<WasteRequest[]>([]);
  const [isFetchingWaste, setIsFetchingWaste] = useState(true);
  const [requestHistory, setRequestHistory] = useState<WasteRequest[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [transporters, setTransporters] = useState<UserProfile[]>([]);
  const [isFetchingTransporters, setIsFetchingTransporters] = useState(true);
  const [inventory, setInventory] = useState<RecycledMaterial[]>([]);
  const [isFetchingInventory, setIsFetchingInventory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof recycledMaterialSchema>>({
    resolver: zodResolver(recycledMaterialSchema),
    defaultValues: {
      type: "",
      quantity: 0,
      price: 0,
    },
  });


  // Fetch incoming waste requests
  useEffect(() => {
    if (!userProfile?.location) {
      setIsFetchingWaste(false);
      return;
    }

    setIsFetchingWaste(true);
    const requestsRef = collection(db, "wasteRequests");
    
    const q = query(
      requestsRef, 
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteRequest))
        .filter(request => {
          return request.industrialistLocation?.toLowerCase().includes(userProfile.location?.toLowerCase() || "");
        }); 
      
      requestsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setIncomingWaste(requestsData);
      setIsFetchingWaste(false);
    }, (error) => {
      console.error("Error fetching incoming waste:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch incoming waste requests."
      });
      setIsFetchingWaste(false);
    });

    return () => unsubscribe();
  }, [userProfile?.location, toast]);

  // Fetch request history for the recycler
   useEffect(() => {
    if (!user) return;

    setIsFetchingHistory(true);
    const requestsRef = collection(db, "wasteRequests");
    
    const q = query(
      requestsRef,
      where("acceptedByRecyclerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteRequest));
      historyData.sort((a, b) => (b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0));
      setRequestHistory(historyData);
      setIsFetchingHistory(false);
    }, (error) => {
      console.error("Error fetching request history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch your request history."
      });
      setIsFetchingHistory(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  // Fetch recycler's inventory
  useEffect(() => {
    if (!user) return;

    setIsFetchingInventory(true);
    const inventoryRef = collection(db, "recycledMaterials");
    const q = query(inventoryRef, where("recyclerId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecycledMaterial));
      inventoryData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setInventory(inventoryData);
      setIsFetchingInventory(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      setIsFetchingInventory(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Fetch all Transporters
  useEffect(() => {
    async function fetchTransporters() {
      setIsFetchingTransporters(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "Transporter"));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        setTransporters(usersData);
      } catch (error) {
        console.error("Error fetching transporters:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch available transporters."
        });
      } finally {
        setIsFetchingTransporters(false);
      }
    }
    fetchTransporters();
  }, [toast]);


  const handleAcceptRequest = async (requestId: string) => {
    if (!user || !userProfile) return;

    const requestRef = doc(db, "wasteRequests", requestId);
    try {
      await updateDoc(requestRef, {
        status: "accepted",
        acceptedByRecyclerId: user.uid,
        recyclerName: userProfile.plantName || userProfile.displayName,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Request Accepted",
        description: "The industrialist has been notified.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not accept the request. " + error.message,
      });
    }
  };
  
  async function onAddMaterial(values: z.infer<typeof recycledMaterialSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Authentication error."});
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "recycledMaterials"), {
        recyclerId: user.uid,
        type: values.type,
        quantity: values.quantity,
        price: values.price,
        status: 'available',
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Material Added",
        description: `${values.type} has been added to your inventory. Industrialists will be notified.`
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add material", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!userProfile?.location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Your Plant's Location</CardTitle>
          <CardDescription>To receive waste requests, you need to set your facility's location.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>Location Required</AlertTitle>
            <AlertDescription>
              Please go to your profile to set a location. This will allow industrialists in your area to find you.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-4">
            <Link href="/dashboard/profile">Set My Location</Link>
          </Button>
        </CardContent>
      </Card>
    );
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
    <Tabs defaultValue="incoming-waste">
      <TabsList className="grid w-full grid-cols-4 md:w-[800px]">
        <TabsTrigger value="incoming-waste">Incoming Waste</TabsTrigger>
        <TabsTrigger value="my-inventory">My Inventory</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="find-transporters">Find Transporters</TabsTrigger>
      </TabsList>
      <TabsContent value="incoming-waste">
        <Card>
          <CardHeader>
            <CardTitle>Incoming Waste Requests</CardTitle>
            <CardDescription>These are pending waste pickup requests from industrialists near <strong>{userProfile?.location || 'your area'}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingWaste ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : incomingWaste.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Industrialist</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Waste Type</TableHead>
                    <TableHead>Quantity (kg)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingWaste.map((request) => (
                    <TableRow key={request.id}>
                       <TableCell>
                        {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{request.industrialistName}</TableCell>
                      <TableCell>{request.industrialistLocation}</TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleAcceptRequest(request.id)}>
                            Accept
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert variant="default">
                <Search className="h-4 w-4" />
                <AlertTitle>No Pending Requests</AlertTitle>
                <AlertDescription>
                  There are currently no pending waste requests in your area. You will be notified when a new one is submitted.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="my-inventory">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Recycled Materials</CardTitle>
              <CardDescription>This is your current inventory of processed, ready-to-sell materials.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2"/>
                  Add New Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Recycled Material</DialogTitle>
                  <DialogDescription>
                    Fill in the details of the material you have processed and want to list for sale.
                  </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddMaterial)} className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Type</FormLabel>
                        <FormControl><Input placeholder="e.g., PET Flakes" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (in kg)</FormLabel>
                        <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per kg ($)</FormLabel>
                        <FormControl><Input type="number" placeholder="1.25" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Material
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isFetchingInventory ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : inventory.length > 0 ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity (kg)</TableHead>
                    <TableHead>Price/kg ($)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                       <TableCell><Badge variant="outline" className="capitalize">{item.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <Alert variant="default">
                <Search className="h-4 w-4" />
                <AlertTitle>No Inventory Found</AlertTitle>
                <AlertDescription>
                  You haven't added any recycled materials yet. Click "Add New Material" to get started.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>My Job History</CardTitle>
            <CardDescription>A log of all the waste requests you have processed.</CardDescription>
          </CardHeader>
          <CardContent>
             {isFetchingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requestHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Industrialist</TableHead>
                    <TableHead>Waste Type</TableHead>
                     <TableHead>Quantity (kg)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestHistory.map((request) => (
                    <TableRow key={request.id}>
                       <TableCell>
                        {request.updatedAt ? new Date(request.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{request.industrialistName}</TableCell>
                      <TableCell>{request.type}</TableCell>
                       <TableCell>{request.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(request.status)} className="capitalize">{request.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert variant="default">
                <Search className="h-4 w-4" />
                <AlertTitle>No History Found</AlertTitle>
                <AlertDescription>
                  You have not accepted or completed any waste requests yet.
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
             Browse all available transport providers to handle logistics.
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

    