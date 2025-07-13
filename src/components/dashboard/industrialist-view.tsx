"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapView } from "@/components/map-view";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const wasteRequestSchema = z.object({
  type: z.string().min(1, "Waste type is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  image: z.any().optional(),
  notes: z.string().optional(),
});

const mockRequests = [
  { id: 'WR001', type: 'Plastic Bottles', quantity: 150, status: 'completed' },
  { id: 'WR002', type: 'Cardboard', quantity: 500, status: 'in-transit' },
  { id: 'WR003', type: 'E-Waste', quantity: 50, status: 'accepted' },
  { id: 'WR004', type: 'Scrap Metal', quantity: 1200, status: 'pending' },
];

export function IndustrialistView() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof wasteRequestSchema>>({
    resolver: zodResolver(wasteRequestSchema),
    defaultValues: {
      type: "",
      quantity: 0,
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof wasteRequestSchema>) {
    setLoading(true);
    console.log(values);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Request Submitted!",
        description: "Your waste pickup request has been sent to nearby facilities.",
      });
      form.reset();
      setLoading(false);
    }, 1500);
  }

  const statusVariant = (status: string) => {
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
      <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
        <TabsTrigger value="new-request">New Request</TabsTrigger>
        <TabsTrigger value="my-requests">My Requests</TabsTrigger>
      </TabsList>
      <TabsContent value="new-request">
        <Card>
          <CardHeader>
            <CardTitle>Submit a Waste Pickup Request</CardTitle>
            <CardDescription>Fill out the form below to schedule a pickup for your recyclable waste.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
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
                <div className="flex flex-col gap-4">
                   <FormLabel>Pickup Location</FormLabel>
                   <MapView />
                   <FormDescription>Nearby recycling plants will be notified based on this location.</FormDescription>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Waste Type</TableHead>
                  <TableHead>Quantity (kg)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(request.status)} className="capitalize">{request.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
