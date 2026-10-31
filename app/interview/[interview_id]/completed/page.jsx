'use client';
import { Check, Clock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const InterviewCompleted = () => {
  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-6">
      <div className="max-w-[560px] w-full bg-surface p-8 sm:p-10 rounded-xl shadow-card text-center border border-line space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-success-soft text-success mx-auto flex items-center justify-center">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-sage-700">Interview Recorded</span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Assessment Completed
          </h1>
          <p className="text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
            Thank you for completing your voice AI evaluation session. Your responses and dialogue transcript have been securely recorded.
          </p>
        </div>

        {/* Process Timeline Card */}
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-surface-alt border border-line">
            <div className="w-8 h-8 rounded-md bg-sage-100 flex items-center justify-center text-sage-700 shrink-0">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">Encrypted Storage</h3>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Your audio recording and transcript are protected under strict privacy protocols for the hiring team.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-surface-alt border border-line">
            <div className="w-8 h-8 rounded-md bg-sage-100 flex items-center justify-center text-sage-700 shrink-0">
              <Clock className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">Evaluation Timeline</h3>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                The hiring team reviews automated competency scores typically within 2–3 business days.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-surface-alt border border-line">
            <div className="w-8 h-8 rounded-md bg-sage-100 flex items-center justify-center text-sage-700 shrink-0">
              <Mail className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">Direct Notification</h3>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                You will receive an email confirmation regarding your status and potential next evaluation steps.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/candidate/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-10 px-6 bg-sage-700 hover:bg-sage-800 text-white font-medium text-xs">
              Go to Candidate Dashboard
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-ink-subtle">
          You may now safely close this browser window.
        </p>
      </div>
    </div>
  );
};

export default InterviewCompleted;
