import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  adminCode: z.string().optional(),
  staffCode: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const role = searchParams.get("role") || "student";
  
  const registerMutation = useRegister();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      adminCode: "",
      staffCode: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError(null);
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({
          title: "Registration successful",
          description: `Welcome to CampusDesk, ${data.user.name}`,
        });
        
        if (data.user.role === "admin") setLocation("/admin");
        else if (data.user.role === "staff") setLocation("/staff");
        else setLocation("/dashboard");
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Registration failed. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-6">
        <Link href="/role" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to roles
        </Link>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 shadow-xl">
            <CardHeader className="space-y-2">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <span className="text-xl font-bold">C</span>
                </div>
              </div>
              <CardTitle className="text-2xl text-center capitalize">Register Account</CardTitle>
              <CardDescription className="text-center">
                Create a new {role} account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                          <Input placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {role === "admin" && (
                    <FormField
                      control={form.control}
                      name="adminCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Registration Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter admin secret code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {role === "staff" && (
                    <FormField
                      control={form.control}
                      name="staffCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Staff Registration Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter staff secret code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href={`/login?role=${role}`} className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
