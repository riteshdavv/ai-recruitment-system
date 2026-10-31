'use client';
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/services/supabaseClient";
import { Mail, Lock, User2Icon } from "lucide-react";
import Link from "next/link";

export function RegisterForm() {
  const { signUpNewUser } = UserAuth();
  const router = useRouter();

  const emailRef = useRef();
  const nameRef = useRef();
  const passwordRef = useRef();
  const [role, setRole] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();

    const email = emailRef.current?.value.trim().toLowerCase();
    const name = nameRef.current?.value.trim();
    const password = passwordRef.current?.value;

    if (!email || !name || !password || !role) {
      toast.error("Please fill in all fields including your role.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUpNewUser(email, password, {
        name,
        role,
      });

      if (result.success) {
        toast.success("Account created successfully! Redirecting...");
        router.push("/login");
      } else {
        toast.error(result.error || "Email already registered.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const SignUpWithGoogle = async () => {
    if (!role) {
      toast.error("Please select whether you are a Candidate or Recruiter first.");
      return;
    }
  
    localStorage.setItem("pending_role", role); 
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  
    if (error) {
      toast.error("Google sign-up failed: " + error.message);
    } else {
      toast.success("Redirecting to Google...");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="text-sm text-ink-muted">Register to set up AI interviews or join sessions</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-ink">Full Name</Label>
          <div className="relative">
            <User2Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" strokeWidth={1.75} />
            <Input
              id="name"
              type="text"
              placeholder="Alex Morgan"
              required
              ref={nameRef}
              className="pl-9 font-normal"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-ink">Work or Personal Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" strokeWidth={1.75} />
            <Input
              id="email"
              type="email"
              placeholder="alex@company.com"
              required
              ref={emailRef}
              className="pl-9 font-normal"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-ink">Password (8+ chars)</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" strokeWidth={1.75} />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              ref={passwordRef}
              className="pl-9 font-normal"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role" className="text-xs font-medium text-ink">Register as</Label>
          <Select onValueChange={setRole} value={role}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recruiter">Recruiter (Create & Manage Roles)</SelectItem>
              <SelectItem value="candidate">Candidate (Take Interviews)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white font-medium"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </Button>
      </form>

      <div className="relative text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-line">
        <span className="relative z-10 bg-surface px-2 text-ink-muted">
          Or continue with
        </span>
      </div>

      <Button
        variant="outline"
        className="w-full h-10 flex items-center justify-center gap-2.5 font-medium border-line hover:bg-sage-100 text-ink"
        onClick={SignUpWithGoogle}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        Register with Google
      </Button>

      <p className="text-center text-xs text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-sage-700 font-semibold underline underline-offset-4 hover:text-sage-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
