import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldAlert, Wrench } from "lucide-react";
import { motion } from "framer-motion";

export default function RoleSelection() {
  const [, setLocation] = useLocation();

  const handleSelectRole = (role: string) => {
    if (role === "student") {
      setLocation("/register?role=student");
    } else {
      setLocation(`/login?role=${role}`);
    }
  };

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Report issues, track progress, and provide feedback.",
      icon: <User className="w-10 h-10 text-primary" />,
      color: "bg-primary/10 border-primary/20",
      hover: "hover:bg-primary/5 hover:border-primary/40",
    },
    {
      id: "staff",
      title: "Staff Member",
      description: "View assigned tasks and update resolution status.",
      icon: <Wrench className="w-10 h-10 text-blue-500" />,
      color: "bg-blue-500/10 border-blue-500/20",
      hover: "hover:bg-blue-500/5 hover:border-blue-500/40",
    },
    {
      id: "admin",
      title: "Administrator",
      description: "Oversee all operations, manage users, and assign tasks.",
      icon: <ShieldAlert className="w-10 h-10 text-purple-500" />,
      color: "bg-purple-500/10 border-purple-500/20",
      hover: "hover:bg-purple-500/5 hover:border-purple-500/40",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl w-full z-10 space-y-8">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg"
          >
            <span className="text-3xl font-bold">C</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
          >
            CampusDesk
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Select your role to continue to the portal.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Card 
                className={`h-full cursor-pointer transition-all duration-300 border-2 ${role.color} ${role.hover} hover:shadow-md hover:-translate-y-1`}
                onClick={() => handleSelectRole(role.id)}
              >
                <CardHeader className="text-center space-y-4 pb-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-background flex items-center justify-center shadow-sm">
                    {role.icon}
                  </div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  <p>{role.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}