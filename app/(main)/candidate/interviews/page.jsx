'use client';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/app/provider';
import { supabase } from '@/services/supabaseClient';
import { Video, Calendar, Clock, CheckCircle, AlertTriangle, XCircle, Hourglass } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function CandidateInterviews() {
  const { user } = useUser();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchCandidateInterviews();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user]);

  const fetchCandidateInterviews = async () => {
    try {
      setLoading(true);
      const { data: results, error } = await supabase
        .from('interview_results')
        .select('*')
        .eq('email', user.email)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching interviews:', error?.message || error);
        toast.error('Failed to load interviews');
        return;
      }

      if (!results || results.length === 0) {
        setInterviews([]);
        return;
      }

      const interviewIds = [...new Set(results.map((r) => r.interview_id).filter(Boolean))];
      let interviewsMap = {};

      if (interviewIds.length > 0) {
        const { data: interviewsData } = await supabase
          .from('Interviews')
          .select('interview_id, jobPosition, duration')
          .in('interview_id', interviewIds);

        if (interviewsData) {
          interviewsMap = interviewsData.reduce((acc, curr) => {
            acc[curr.interview_id] = curr;
            return acc;
          }, {});
        }
      }

      const combined = results.map((r) => ({
        ...r,
        Interviews: interviewsMap[r.interview_id] || null,
      }));

      setInterviews(combined);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Derive the status to show the candidate.
   * Priority: recruiter_decision (written by send-decision route) > "Under Review"
   */
  const getStatus = (result) => {
    const decision = result.recruiter_decision;

    if (!decision) {
      return { label: 'Under Review', icon: Hourglass, variant: 'review' };
    }

    const d = decision.toLowerCase();
    if (d === 'advanced' || d === 'selected') {
      return { label: 'Advanced to Next Stage', icon: CheckCircle, variant: 'advanced' };
    }
    if (d === 'rejected') {
      return { label: 'Not Selected', icon: XCircle, variant: 'rejected' };
    }
    if (d.includes('follow') || d === 'reevaluate') {
      return { label: 'Follow-up Requested', icon: AlertTriangle, variant: 'followup' };
    }
    return { label: decision, icon: Hourglass, variant: 'review' };
  };

  const statusStyles = {
    review:   'bg-surface-alt text-ink-muted border-line',
    advanced: 'bg-success-soft text-success border-success/20',
    rejected: 'bg-danger-soft text-danger border-danger/20',
    followup: 'bg-warning-soft text-warning border-warning/20',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">My Interviews</h1>
        <p className="text-ink-muted text-sm mt-1">
          History of your completed voice interview sessions and recruiter decisions
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-lg border border-line animate-pulse" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-lg p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 mb-3">
            <Video className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="font-semibold text-ink text-base mb-1">No completed interviews yet</h3>
          <p className="text-ink-muted text-sm max-w-sm">
            Once you launch and complete an interview session via an invitation link, your results will be listed here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((result) => {
            const { label, icon: StatusIcon, variant } = getStatus(result);

            return (
              <div
                key={result.id}
                className="bg-surface border border-line rounded-lg shadow-card p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left — role + meta */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700 flex-shrink-0 mt-0.5">
                      <Video className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink text-base truncate">
                        {result.Interviews?.jobPosition || 'Role Interview'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-ink-muted mt-1.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                          {moment(result.completed_at || result.created_at).format('MMM DD, YYYY • h:mm A')}
                        </span>
                        {result.Interviews?.duration && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                              {result.Interviews.duration}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="bg-sage-100 text-sage-900 px-2 py-0.5 rounded-full border border-sage-200">
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right — status badge only */}
                  <div className="flex-shrink-0 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${statusStyles[variant]}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {label}
                    </span>
                  </div>
                </div>

                {/* Context note based on status */}
                <p className="mt-3 pt-3 border-t border-line text-xs text-ink-muted leading-relaxed">
                  {variant === 'review' &&
                    'Your responses are being reviewed by the recruiting team. You will be notified of any update via email.'}
                  {variant === 'advanced' &&
                    'Congratulations! The recruiter has advanced your application. Check your email for next steps.'}
                  {variant === 'rejected' &&
                    'The recruiter has concluded your application for this role. Check your email for details.'}
                  {variant === 'followup' &&
                    'The recruiter has requested a follow-up. Check your email for scheduling details.'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
