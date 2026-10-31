"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Shield, LogOut } from "lucide-react";

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "Recruiter Account",
    email: "recruiter@example.com",
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      toast.success("Profile updated successfully");
      setLoading(false);
    }, 600);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      toast.success("Password changed successfully");
      setPassword("");
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-ink-muted mt-0.5">Manage your workspace preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Section */}
        <Card className="bg-surface border-line shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <User className="w-4 h-4 text-sage-700" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs font-medium text-ink">
                  Full Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs font-medium text-ink">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-10 text-xs font-medium" disabled={loading}>
                {loading ? "Updating..." : "Update Details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="bg-surface border-line shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <Shield className="w-4 h-4 text-sage-700" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-xs font-medium text-ink">
                  New Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1"
                  required
                />
              </div>
              <Button variant="outline" type="submit" className="w-full h-10 text-xs font-medium" disabled={loading || !password}>
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Logout Action */}
      <div className="flex justify-end pt-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-danger hover:bg-danger-soft hover:text-danger hover:border-danger/30 text-xs h-9"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Log out
        </Button>
      </div>
    </div>
  );
}
