
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { WasteRequest } from "@/lib/types";
import { Loader2, Truck, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function TransporterView() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();

    const [availableJobs, setAvailableJobs] = useState<WasteRequest[]>([]);
    const [myJobs, setMyJobs] = useState<WasteRequest[]>([]);
    const [isFetchingAvailable, setIsFetchingAvailable] = useState(true);
    const [isFetchingMine, setIsFetchingMine] = useState(true);

    // Fetch available jobs (status: 'accepted')
    useEffect(() => {
        setIsFetchingAvailable(true);
        const requestsRef = collection(db, "wasteRequests");
        const q = query(requestsRef, where("status", "==", "accepted"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteRequest));
            jobsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setAvailableJobs(jobsData);
            setIsFetchingAvailable(false);
        }, (error) => {
            console.error("Error fetching available jobs:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch available transport jobs." });
            setIsFetchingAvailable(false);
        });

        return () => unsubscribe();
    }, [toast]);

    // Fetch jobs accepted by the current transporter
    useEffect(() => {
        if (!user) return;
        setIsFetchingMine(true);
        const requestsRef = collection(db, "wasteRequests");
        const q = query(requestsRef, where("transportedById", "==", user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WasteRequest));
             jobsData.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            setMyJobs(jobsData);
            setIsFetchingMine(false);
        }, (error) => {
            console.error("Error fetching my jobs:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch your jobs." });
            setIsFetchingMine(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const handleAcceptJob = async (requestId: string) => {
        if (!user || !userProfile) return;

        const requestRef = doc(db, "wasteRequests", requestId);
        try {
            await updateDoc(requestRef, {
                status: "in-transit",
                transportedById: user.uid,
                transporterName: userProfile.displayName,
                updatedAt: serverTimestamp(),
            });
            toast({
                title: "Job Accepted",
                description: "The job has been added to your list.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not accept the job. " + error.message,
            });
        }
    };

    const statusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
          case 'completed': return 'default';
          case 'in-transit': return 'secondary';
          case 'accepted': return 'outline';
          case 'pending': return 'destructive';
          default: return 'secondary';
        }
    }

    const renderJobsTable = (jobs: WasteRequest[], isLoading: boolean, emptyTitle: string, emptyDesc: string, showAcceptButton: boolean = false) => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (jobs.length === 0) {
            return (
                <Alert variant="default">
                    <Search className="h-4 w-4" />
                    <AlertTitle>{emptyTitle}</AlertTitle>
                    <AlertDescription>{emptyDesc}</AlertDescription>
                </Alert>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Waste Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell>{job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>{job.type}</TableCell>
                            <TableCell>{job.industrialistLocation}</TableCell>
                            <TableCell>{job.recyclerName}</TableCell>
                            <TableCell><Badge variant={statusVariant(job.status)} className="capitalize">{job.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                {showAcceptButton && (
                                    <Button variant="outline" size="sm" onClick={() => handleAcceptJob(job.id)}>
                                        Accept Job
                                    </Button>
                                )}
                                {!showAcceptButton && <Button variant="outline" size="sm" disabled>View Details</Button>}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <Tabs defaultValue="available-jobs">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="available-jobs">Available Jobs</TabsTrigger>
                <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
            </TabsList>
            <TabsContent value="available-jobs">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Transport Jobs</CardTitle>
                        <CardDescription>These are waste requests that have been accepted by recyclers and need transport.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderJobsTable(availableJobs, isFetchingAvailable, "No Available Jobs", "Check back later for new transport requests.", true)}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="my-jobs">
                <Card>
                    <CardHeader>
                        <CardTitle>My Transport Jobs</CardTitle>
                        <CardDescription>These are transport jobs that you have accepted.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderJobsTable(myJobs, isFetchingMine, "You have no active jobs", "Accept a job from the 'Available Jobs' tab to get started.")}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
