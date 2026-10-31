"use client"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { UserAuth } from "@/context/AuthContext";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/services/supabaseClient"
import Link from "next/link";

export function LoginForm(props) {
  const { className, ...rest } = props;
  const router = useRouter();
  const { signInUser } = UserAuth();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = emailRef.current?.value?.trim().toLowerCase() || "";
    const password = passwordRef.current?.value || "";

    if (!email || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { success, error } = await signInUser(email, password);

      if (!success) {
        toast.error(error || "Login failed. Please verify credentials.");
        setLoading(false);
        return;
      }

      toast.success("Signed in successfully!");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const SignInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, 
      },
    });
  
    if (error) {
      toast.error("Google login failed: " + error.message);
    } else {
      toast.success("Redirecting to Google authentication...");
    }
  };

  return (
    <div className={cn("space-y-6", className)} {...rest}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in to your account</h1>
        <p className="text-sm text-ink-muted">
          Access your candidate evaluations and interview dashboards
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-ink">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" strokeWidth={1.75} />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              required
              ref={emailRef}
              className="pl-9 font-normal"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-ink">Password</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" strokeWidth={1.75} />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              ref={passwordRef}
              className="pl-9 font-normal"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white font-medium"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
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
        onClick={SignInWithGoogle}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        Sign in with Google
      </Button>

      <p className="text-center text-xs text-ink-muted">
        Don't have an account yet?{" "}
        <Link href="/register" className="text-sage-700 font-semibold underline underline-offset-4 hover:text-sage-800">
          Create account
        </Link>
      </p>
    </div>
  );
}
