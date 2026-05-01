import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
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
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const role = searchParams.get("role") || "student";
  
  const loginMutation = useLogin();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError(null);
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.name}`,
        });
        
        // Redirect based on actual user role
        if (data.user.role === "admin") setLocation("/admin");
        else if (data.user.role === "staff") setLocation("/staff");
        else setLocation("/dashboard");
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Failed to login. Please check your credentials.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
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
              <CardTitle className="text-2xl text-center capitalize">{role} Login</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
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
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </Form>
              
              {role === "student" && (
                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <Link href="/register?role=student" className="text-primary hover:underline font-medium">
                    Register here
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
