"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (error.status === 429 || error.message?.toLowerCase().includes("rate limit")) {
          toast.error("Email rate limit exceeded. Supabase default mailer limits emails to a few per hour. Please wait a few minutes before retrying.", {
            duration: 6000,
          });
        } else {
          toast.error(error.message || "Failed to send reset link.");
        }
      } else {
        setSubmitted(true);
        toast.success("Password reset link sent! Check your inbox.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-sage-800">
            <CheckCircle2 className="w-6 h-6 text-sage-700" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Check your email</h1>
          <p className="text-sm text-ink-muted max-w-sm">
            We’ve sent a password reset link to{" "}
            <span className="font-semibold text-ink">{email}</span>. Click the link in the email to set a new password.
          </p>
        </div>

        <div className="p-3.5 bg-sage-50 border border-line rounded-lg text-xs text-ink-muted leading-relaxed">
          <p className="font-medium text-ink mb-1">Didn’t receive the email?</p>
          Check your spam folder or wait a minute before requesting another link.
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 border-line hover:bg-sage-100 text-ink"
            onClick={() => setSubmitted(false)}
          >
            Try another email
          </Button>

          <Link href="/login" className="block">
            <Button
              type="button"
              className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Forgot password?</h1>
        <p className="text-sm text-ink-muted">
          Enter your registered email address and we’ll send you a secure link to reset your password.
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 font-normal"
              disabled={loading}
              autoFocus
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
              Sending reset link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700 hover:text-sage-800 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

