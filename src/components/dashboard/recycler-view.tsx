
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import type { WasteRequest, UserProfile } from "@/lib/types";
import { Loader2, Search, MapPin, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { TransporterCard } from "../transporter-card";


const mockInventory = [
    { id: 'RM001', type: 'PET Flakes', quantity: 5000, price: 1.25 },
    { id: 'RM002', type: 'Aluminum Ingots', quantity: 2500, price: 2.50 },
    { id: 'RM003', type: 'Copper Granules', quantity: 1000, price: 8.75 },
    { id: 'RM004', type: 'Shredded Paper', quantity: 10000, price: 0.50 },
];

export function RecyclerView() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [incomingWaste, setIncomingWaste] = useState<WasteRequest[]>([]);
  const [isFetchingWaste, setIsFetchingWaste] = useState(true);
  const [requestHistory, setRequestHistory] = useState<WasteRequest[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [transporters, setTransporters] = useState<UserProfile[]>([]);
  const [isFetchingTransporters, setIsFetchingTransporters] = useState(true);


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

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteRequest))
        .filter(request => {
          // Basic location matching, could be improved with geocoding
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
      historyData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
            <Button>Add New Material</Button>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity (kg)</TableHead>
                  <TableHead className="text-right">Price/kg ($)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                        {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
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
