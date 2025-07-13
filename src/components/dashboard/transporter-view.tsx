"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockJobs = [
    { id: 'TJ001', from: 'MetalWorks Inc.', to: 'GreenRecycle', type: 'Scrap Metal', distance: 5.2, status: 'Pending' },
    { id: 'TJ002', from: 'Printify Co.', to: 'EcoPlanet', type: 'Paper', distance: 8.1, status: 'Pending' },
    { id: 'TJ003', from: 'FoodPack', to: 'GreenRecycle', type: 'Plastic Bottles', distance: 15.7, status: 'Accepted' },
    { id: 'TJ004', from: 'BuildRight', to: 'Re-Source Co.', type: 'Concrete', distance: 22.0, status: 'Pending' },
];


export function TransporterView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Available Transport Jobs</CardTitle>
                <CardDescription>These are transport jobs available for you to accept.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job ID</TableHead>
                            <TableHead>Pickup</TableHead>
                            <TableHead>Dropoff</TableHead>
                            <TableHead>Waste Type</TableHead>
                            <TableHead>Distance (km)</TableHead>
                             <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockJobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.id}</TableCell>
                                <TableCell>{job.from}</TableCell>
                                <TableCell>{job.to}</TableCell>
                                <TableCell>{job.type}</TableCell>
                                <TableCell>{job.distance}</TableCell>
                                <TableCell>
                                    <Badge variant={job.status === 'Pending' ? 'outline' : 'default'} className="capitalize">{job.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {job.status === 'Pending' && (
                                        <Button size="sm">Accept Job</Button>
                                    )}
                                    {job.status === 'Accepted' && (
                                         <Button variant="secondary" size="sm">View Details</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
