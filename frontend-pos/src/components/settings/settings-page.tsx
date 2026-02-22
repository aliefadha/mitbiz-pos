import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { usersApi } from "@/lib/api/users";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
});

export function SettingsPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; image?: string }) =>
      usersApi.updateProfile(data),
    onSuccess: () => {
      refetch();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update profile");
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        email: profile.email,
      });
    }
  }, [profile, form]);

  if (isLoading) {
    return (
      <div className="max-w-[600px]">
        <div className="mb-6">
          <h4 className="text-lg font-semibold m-0">Settings</h4>
          <p className="text-sm text-gray-500 m-0">
            Manage your account settings
          </p>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h4 className="text-lg font-semibold m-0">Settings</h4>
        <p className="text-sm text-gray-500 m-0">
          Manage your account settings
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col md:flex-row gap-8 pt-6">
          <div className="flex flex-col items-center shrink-0 md:w-48">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Change Photo
            </Button>
          </div>

          <div className="flex-1 w-full max-w-xl">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => {
                  updateMutation.mutate({ name: values.name });
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
