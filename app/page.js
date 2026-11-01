'use client';
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/Logo";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Sparkles, CheckCircle2, Shield, Clock, BarChart3, ChevronRight, Users, Play } from "lucide-react";
import React, { useEffect } from "react";
import { useUser } from "@/app/provider";

export default function Home() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    // Check if user arrived via a password reset/recovery link
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      if (hash.includes("type=recovery") || search.includes("type=recovery")) {
        router.push(`/reset-password${hash || search}`);
        return;
      }
    }

    if (user) {
      if (user.role === 'recruiter') {
        router.push('/recruiter/dashboard');
      } else if (user.role === 'candidate') {
        router.push('/candidate/dashboard');
      }
    }
  }, [user, router]);

  const clientLogos = [
    { name: "Tata", logo: "/clientLogos/tata.png" },
    { name: "Tech Mahindra", logo: "/clientLogos/techmahindra.png" },
    { name: "Eeshanya", logo: "/clientLogos/eeshanya.png" },
    { name: "HRH", logo: "/clientLogos/hrh.jpeg" },
    { name: "Google", logo: "/clientLogos/Google.png" },
  ];

  return (
    <div className="min-h-screen bg-sage-50 text-ink flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-medium text-ink">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs font-medium bg-sage-700 hover:bg-sage-800 text-white rounded-md">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 border border-sage-200 text-xs font-medium text-sage-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-600" />
            Next-generation voice interview automation
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-ink leading-tight sm:leading-tight">
            Automate first-round interviews with voice AI.
          </h1>

          <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
            Screen candidates faster with intelligent, conversational voice agents. Get instant objective evaluations, timestamped dialogue transcripts, and skill ratings.
          </p>

          {/* Primary & Secondary CTAs as per Section 6.5 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              onClick={() => router.push('/login')}
              size="lg"
              className="w-full sm:w-auto h-11 px-6 bg-sage-700 hover:bg-sage-800 text-white rounded-md text-sm font-medium"
            >
              Start Recruiting
              <ArrowRight className="ml-2 w-4 h-4" strokeWidth={2} />
            </Button>
            <Button
              onClick={() => router.push('/register')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-11 px-6 border-line bg-surface text-ink hover:bg-sage-100 rounded-md text-sm font-medium"
            >
              Candidate Portal
            </Button>
          </div>

          {/* Product Frame Showcase */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="bg-surface rounded-xl border border-line shadow-pop p-2 sm:p-4 text-left">
              <div className="bg-sage-50 border border-line rounded-lg p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                    <span className="text-xs font-mono text-ink-muted pl-2">Live Session: Software Engineer Screening</span>
                  </div>
                  <span className="text-xs font-mono text-sage-800 bg-sage-100 px-2 py-0.5 rounded-full border border-sage-200">
                    Voice Agent Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-surface rounded-md border border-line p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center text-sage-700">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-ink">AI Interviewer</span>
                      <span className="text-xs text-ink-muted font-mono">02:14</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink leading-relaxed bg-sage-50/70 p-3 rounded border border-line/60">
                      "Could you describe how you approach state management in complex React applications when handling concurrent API streams?"
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-ink-muted">Candidate speaking... live transcription running</span>
                    </div>
                  </div>

                  <div className="bg-surface rounded-md border border-line p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">Live Metric Preview</span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Technical Clarity</span>
                          <span className="font-mono text-sage-800 font-semibold">9/10</span>
                        </div>
                        <div className="w-full bg-sage-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-sage-600 h-full w-[90%]" />
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-ink-muted">Communication</span>
                          <span className="font-mono text-sage-800 font-semibold">8/10</span>
                        </div>
                        <div className="w-full bg-sage-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-sage-600 h-full w-[80%]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-sage-100 text-sage-900 border border-sage-200 text-xs text-center font-medium">
                      Automated Scoring Engine
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Strip */}
        <section className="border-y border-line bg-surface py-8">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs uppercase tracking-widest text-ink-muted font-medium mb-6">
              Trusted by modern talent and hiring teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all">
              {clientLogos.map((client, i) => (
                <div key={i} className="h-8 flex items-center">
                  <Image
                    src={client.logo}
                    alt={client.name}
                    width={90}
                    height={32}
                    className="max-h-7 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3-Column Feature Grid as per Section 6.5 */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sage-700">Enterprise Capabilities</span>
            <h2 className="text-3xl font-semibold tracking-tight text-ink">Engineered for credible hiring decisions</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Eliminate candidate drop-off and manual screening fatigue with automated structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-lg border border-line p-6 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700">
                <Mic className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-semibold text-ink">Conversational AI Agents</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Adaptive voice bots ask questions one by one, provide conversational pacing, and clarify answers naturally.
              </p>
            </div>

            <div className="bg-surface rounded-lg border border-line p-6 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700">
                <BarChart3 className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-semibold text-ink">Structured Skill Rubrics</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Every interview transcript is evaluated across technical accuracy, communication skills, and problem solving.
              </p>
            </div>

            <div className="bg-surface rounded-lg border border-line p-6 shadow-card space-y-3">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700">
                <Shield className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-semibold text-ink">Secure & Auditable</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Full transcripts and feedback logs are preserved with row-level security for compliant recruiter review.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer as per Section 6.5 */}
      <footer className="border-t border-line bg-surface py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span>— AI Voice Recruitment Platform</span>
          </div>
          <p>© {new Date().getFullYear()} Voice AI Recruitment Agent. All rights reserved.</p>
        </div>
      </footer>

      <SpeedInsights />
    </div>
  );
}
