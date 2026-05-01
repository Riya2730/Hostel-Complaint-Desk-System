import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { PlusCircle, MessageSquare, MapPin, AlertCircle, Loader2, Star } from "lucide-react";

import { useAuth } from "@/lib/auth";
import {
  useGetComplaints,
  getGetComplaintsQueryKey,
  useCreateComplaint,
  useUpdateComplaint,
} from "@workspace/api-client-react";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  categoryUser: z.enum(["maintenance", "hygiene", "food", "internet", "security", "noise", "other"]),
  location: z.string().min(3, "Location must be provided"),
});

const feedbackSchema = z.object({
  feedbackRating: z.coerce.number().min(1).max(5),
  feedback: z.string().min(10, "Please provide some feedback"),
});

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState<number | null>(null);

  const { data: complaints, isLoading } = useGetComplaints(undefined, {
    query: {
      enabled: !!token,
      queryKey: getGetComplaintsQueryKey(),
    },
  });

  const createMutation = useCreateComplaint();
  const updateMutation = useUpdateComplaint();

  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryUser: "maintenance",
      location: "",
    },
  });

  const feedbackForm = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackRating: 5,
      feedback: "",
    },
  });

  const onSubmit = (values: z.infer<typeof complaintSchema>) => {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Complaint submitted successfully" });
          setIsDialogOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to submit complaint", variant: "destructive" });
        },
      }
    );
  };

  const onFeedbackSubmit = (values: z.infer<typeof feedbackSchema>) => {
    if (!feedbackDialogOpen) return;
    
    updateMutation.mutate(
      {
        id: feedbackDialogOpen,
        data: values,
      },
      {
        onSuccess: () => {
          toast({ title: "Feedback submitted" });
          setFeedbackDialogOpen(null);
          feedbackForm.reset();
          queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to submit feedback", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Complaints</h1>
          <p className="text-muted-foreground">Track your reported issues and provide feedback.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                Provide details about the problem. Our AI will automatically categorize and prioritize it.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Broken AC in Room 102" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="hygiene">Hygiene</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="internet">Internet</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="noise">Noise</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Block B, Floor 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide specific details..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Complaint
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : !complaints?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No complaints yet</p>
              <p className="text-sm">When you report an issue, it will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          complaints.map((complaint) => (
            <Card key={complaint.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{complaint.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {complaint.location}
                        </span>
                        <span>{format(new Date(complaint.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                  </div>
                  
                  <p className="text-sm mt-4 text-foreground/80 leading-relaxed">
                    {complaint.description}
                  </p>
                  
                  <div className="mt-6 flex flex-wrap gap-2 items-center text-xs">
                    <span className="bg-muted px-2 py-1 rounded capitalize">
                      Type: {complaint.categoryUser}
                    </span>
                    {complaint.categoryAi && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                        AI Tag: {complaint.categoryAi}
                      </span>
                    )}
                    {complaint.assignedToName && (
                      <span className="text-muted-foreground ml-auto">
                        Assigned to: {complaint.assignedToName}
                      </span>
                    )}
                  </div>
                </div>
                
                {complaint.status === "resolved" && (
                  <div className="bg-muted/50 p-6 sm:w-64 border-t sm:border-t-0 sm:border-l flex flex-col justify-center">
                    {complaint.feedbackRating ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < complaint.feedbackRating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                            />
                          ))}
                        </div>
                        {complaint.feedback && (
                          <p className="text-sm italic text-muted-foreground">"{complaint.feedback}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <p className="text-sm font-medium">Issue resolved!</p>
                        <p className="text-xs text-muted-foreground">How did we do?</p>
                        
                        <Dialog open={feedbackDialogOpen === complaint.id} onOpenChange={(open) => setFeedbackDialogOpen(open ? complaint.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">Provide Feedback</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rate Resolution</DialogTitle>
                            </DialogHeader>
                            <Form {...feedbackForm}>
                              <form onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)} className="space-y-4">
                                <FormField
                                  control={feedbackForm.control}
                                  name="feedbackRating"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Rating (1-5)</FormLabel>
                                      <FormControl>
                                        <Input type="number" min={1} max={5} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={feedbackForm.control}
                                  name="feedback"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Comments</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Share your thoughts..." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Submit Feedback
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
