
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  plantName: z.string().optional(),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
  materials: z.array(z.string()).optional(),
  vehicleTypes: z.array(z.string()).optional(),
});

export default function ProfilePage() {
  const { userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [materialInput, setMaterialInput] = useState("");
  const [vehicleInput, setVehicleInput] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      plantName: "",
      location: "",
      materials: [],
      vehicleTypes: [],
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || "",
        plantName: userProfile.plantName || "",
        location: userProfile.location || "",
        materials: userProfile.materials || [],
        vehicleTypes: userProfile.vehicleTypes || [],
      });
    }
  }, [userProfile, form]);

  const handleAddItem = (type: 'material' | 'vehicle') => {
    const input = type === 'material' ? materialInput : vehicleInput;
    const formField = type === 'material' ? 'materials' : 'vehicleTypes';
    const setInput = type === 'material' ? setMaterialInput : setVehicleInput;

    if (input.trim() !== "") {
      const currentItems = form.getValues(formField) || [];
      form.setValue(formField, [...currentItems, input.trim()], { shouldDirty: true });
      setInput("");
    }
  };

  const handleRemoveItem = (itemToRemove: string, type: 'material' | 'vehicle') => {
    const formField = type === 'material' ? 'materials' : 'vehicleTypes';
    const currentItems = form.getValues(formField) || [];
    form.setValue(formField, currentItems.filter(item => item !== itemToRemove), { shouldDirty: true });
  };


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setLoading(true);
    try {
      // Ensure role-specific fields are only sent for the correct roles
      const dataToUpdate: Partial<z.infer<typeof profileSchema>> = {
        ...values,
        plantName: userProfile?.role === 'Recycler' ? values.plantName : undefined,
        materials: userProfile?.role === 'Recycler' ? values.materials : undefined,
        vehicleTypes: userProfile?.role === 'Transporter' ? values.vehicleTypes : undefined,
      };

      await updateUserProfile(dataToUpdate);
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      form.reset(values, { keepValues: true }); 
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details here. Your role and email address cannot be changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {userProfile?.role === 'Recycler' ? "Owner's Full Name" : (userProfile?.role === 'Transporter' ? "Company/Owner Name" : "Full Name")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {userProfile?.role === 'Recycler' && (
                <FormField
                  control={form.control}
                  name="plantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recycling Plant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., GreenCycle Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location / Operating Area</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., City, Postal Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {userProfile?.role === 'Recycler' && (
                 <FormField
                  control={form.control}
                  name="materials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accepted Materials</FormLabel>
                      <FormDescription>
                        Enter the types of waste you recycle (e.g., Plastic, E-Waste).
                      </FormDescription>
                      <div className="flex items-center gap-2">
                        <Input
                          value={materialInput}
                          onChange={(e) => setMaterialInput(e.target.value)}
                          placeholder="e.g., Scrap Metal"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem('material');
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={() => handleAddItem('material')}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {field.value?.map((material) => (
                          <Badge key={material} variant="secondary">
                            {material}
                            <button
                              type="button"
                              className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              onClick={() => handleRemoveItem(material, 'material')}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
               {userProfile?.role === 'Transporter' && (
                 <FormField
                  control={form.control}
                  name="vehicleTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Types</FormLabel>
                      <FormDescription>
                        Enter the types of vehicles you operate (e.g., Small Truck, Large Lorry).
                      </FormDescription>
                      <div className="flex items-center gap-2">
                        <Input
                          value={vehicleInput}
                          onChange={(e) => setVehicleInput(e.target.value)}
                          placeholder="e.g., Cargo Van"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem('vehicle');
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={() => handleAddItem('vehicle')}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {field.value?.map((vehicle) => (
                          <Badge key={vehicle} variant="secondary">
                            {vehicle}
                            <button
                              type="button"
                              className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              onClick={() => handleRemoveItem(vehicle, 'vehicle')}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input value={userProfile?.email || ""} disabled />
              </FormItem>
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Input value={userProfile?.role || ""} disabled />
              </FormItem>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={loading || !form.formState.isDirty}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
