"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // 1. Check if Supabase already parsed a session from the recovery link
        const { data: { session } } = await supabase.auth.getSession();
        
        // 2. Also check URL for access_token or code (in case hash hasn't finished processing)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const search = typeof window !== "undefined" ? window.location.search : "";
        const hasRecoveryHash = hash.includes("type=recovery") || hash.includes("access_token");
        const hasCode = search.includes("code=");

        if (session || hasRecoveryHash || hasCode) {
          if (mounted) {
            setValidSession(true);
            setVerifying(false);
          }
          return;
        }

        // Give Supabase client a short moment to complete hash parsing if page just loaded
        const timer = setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (mounted) {
            setValidSession(!!retrySession);
            setVerifying(false);
          }
        }, 1200);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error("Session verification error:", err);
        if (mounted) {
          setValidSession(false);
          setVerifying(false);
        }
      }
    };

    checkSession();

    // Listen for auth state changes (e.g., PASSWORD_RECOVERY or SIGNED_IN)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && (event === "PASSWORD_RECOVERY" || session)) {
        setValidSession(true);
        setVerifying(false);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message || "Failed to update password.");
      } else {
        setSuccess(true);
        toast.success("Password updated successfully!");
        
        // Sign out recovery session so user logs in cleanly with new credentials
        await supabase.auth.signOut();

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Password update error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-sage-700" />
        <p className="text-sm text-ink-muted">Verifying recovery link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-sage-800">
            <CheckCircle2 className="w-6 h-6 text-sage-700" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Password Reset Complete</h1>
          <p className="text-sm text-ink-muted max-w-sm">
            Your password has been changed successfully. Redirecting you to sign in...
          </p>
        </div>

        <Link href="/login" className="block">
          <Button
            type="button"
            className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white font-medium"
          >
            Sign In Now
          </Button>
        </Link>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <AlertCircle className="w-6 h-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Invalid or Expired Link</h1>
          <p className="text-sm text-ink-muted max-w-sm">
            The password reset link is invalid or has expired. Please request a new link to reset your password.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/forgot-password" className="block">
            <Button
              type="button"
              className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white font-medium"
            >
              Request New Reset Link
            </Button>
          </Link>

          <Link href="/login" className="block text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700 hover:text-sage-800 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Create new password</h1>
        <p className="text-sm text-ink-muted">
          Your new password must be at least 6 characters long.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-xs font-medium text-ink">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" strokeWidth={1.75} />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10 font-normal"
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-xs font-medium text-ink">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" strokeWidth={1.75} />
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-9 pr-10 font-normal"
              disabled={loading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white font-medium flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating password...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700 hover:text-sage-800 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel and return to Sign In
        </Link>
      </div>
    </div>
  );
}

