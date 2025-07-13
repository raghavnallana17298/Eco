"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";

const mockIncomingWaste = [
    { id: 'WR004', industrialist: 'MetalWorks Inc.', type: 'Scrap Metal', quantity: 1200, distance: 5.2 },
    { id: 'WR005', industrialist: 'Printify Co.', type: 'Paper & Cardboard', quantity: 800, distance: 8.1 },
    { id: 'WR006', industrialist: 'Tech Solutions', type: 'E-Waste', quantity: 150, distance: 12.5 },
];

const mockInventory = [
    { id: 'RM001', type: 'PET Flakes', quantity: 5000, price: 1.25 },
    { id: 'RM002', type: 'Aluminum Ingots', quantity: 2500, price: 2.50 },
    { id: 'RM003', type: 'Copper Granules', quantity: 1000, price: 8.75 },
    { id: 'RM004', type: 'Shredded Paper', quantity: 10000, price: 0.50 },
];

export function RecyclerView() {
  return (
    <Tabs defaultValue="incoming-waste">
      <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
        <TabsTrigger value="incoming-waste">Incoming Waste</TabsTrigger>
        <TabsTrigger value="my-inventory">My Inventory</TabsTrigger>
      </TabsList>
      <TabsContent value="incoming-waste">
        <Card>
          <CardHeader>
            <CardTitle>Incoming Waste Requests</CardTitle>
            <CardDescription>These are pending waste pickup requests from nearby industrialists.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Industrialist</TableHead>
                  <TableHead>Waste Type</TableHead>
                  <TableHead>Quantity (kg)</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockIncomingWaste.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.industrialist}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>{request.distance}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm">View & Accept</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </Tabs>
  );
}
