
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
});

export default function ProfilePage() {
  const { userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      location: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || "",
        location: userProfile.location || "",
      });
    }
  }, [userProfile, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setLoading(true);
    try {
      await updateUserProfile(values);
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      form.reset(values, { keepValues: true }); // Keep the new values in the form
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
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details here. Your role and email address cannot be changed.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., City, Postal Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
