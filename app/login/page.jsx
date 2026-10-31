"use client";
import Image from "next/image";
import { LoginForm } from "../../components/login-form";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-sage-50">
      {/* Left — White Form Card Panel */}
      <div className="flex flex-col justify-between p-6 sm:p-12 md:p-16 bg-surface border-r border-line">
        <div>
          <Link href="/" className="inline-block mb-10">
            <Logo size="lg" />
          </Link>

          <div className="max-w-sm">
            <LoginForm />
          </div>
        </div>

        <div className="pt-8 text-xs text-ink-muted">
          Protected by enterprise-grade access control & encryption.
        </div>
      </div>

      {/* Right — Sage-100 Panel with abstract waveform artwork & one-line value statement */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-sage-100 relative overflow-hidden">
        {/* Subtle decorative background waveform SVG */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <svg
            className="w-full h-full text-sage-400"
            viewBox="0 0 600 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 200 C 150 120, 250 280, 400 200 C 500 150, 550 240, 600 200"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />
            <path
              d="M0 230 C 120 160, 280 320, 420 220 C 510 160, 560 260, 600 230"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="280" cy="200" r="140" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="280" cy="200" r="90" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
          </svg>
        </div>

        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest text-sage-800 font-semibold">
            Voice AI Hiring
          </span>
        </div>

        {/* One-line value statement as per Section 6.5 */}
        <div className="relative z-10 max-w-md space-y-3">
          <h2 className="text-3xl font-semibold text-ink leading-tight">
            Conversational AI assessments that candidates respect and recruiters trust.
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Eliminate scheduling lag and evaluate real technical communication with autonomous voice agents.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-sage-800 font-medium">
          <span className="w-2 h-2 rounded-full bg-sage-700" />
          Live Voice Evaluation Engine
        </div>
      </div>
    </div>
  );
}
