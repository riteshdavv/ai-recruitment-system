'use client';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/app/provider';
import { supabase } from '@/services/supabaseClient';
import { Video, Calendar, Clock, Star, CheckCircle, AlertTriangle } from 'lucide-react';
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
          .select('interview_id, jobPosition, jobDescription, type, duration, created_at, userEmail')
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

  const calculateOverallScore = (feedback) => {
    if (!feedback?.rating) return null;
    const ratings = Object.values(feedback.rating).filter(val => typeof val === 'number');
    if (ratings.length === 0) return null;
    return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">My Interviews</h1>
        <p className="text-ink-muted text-sm mt-1">History of all voice interview sessions, assessments, and feedback</p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-lg border border-line animate-pulse p-6" />
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
            const score = calculateOverallScore(result.conversation_transcript?.feedback);
            const feedback = result.conversation_transcript?.feedback;
            const isRecommended = feedback?.Recommendation
              ? !feedback.Recommendation.toLowerCase().includes('not')
              : null;

            return (
              <div
                key={result.id}
                className="bg-surface border border-line rounded-lg shadow-card p-5 sm:p-6 transition-all hover:border-sage-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
                          {moment(result.completed_at || result.created_at).format('MMM DD, YYYY')}
                        </span>
                        <span>•</span>
                        {result.Interviews?.duration && (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                              {result.Interviews.duration}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="bg-sage-100 text-sage-900 px-2 py-0.5 rounded-full border border-sage-200">
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status / Rating */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    {score !== null && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-900 border border-sage-200 tabular-nums">
                        <Star className="w-3.5 h-3.5 text-sage-700" strokeWidth={2} />
                        Score: {score}/10
                      </span>
                    )}
                    {isRecommended !== null && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          isRecommended
                            ? 'bg-success-soft text-success border border-success/20'
                            : 'bg-warning-soft text-warning border border-warning/20'
                        }`}
                      >
                        {isRecommended ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                            Recommended
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
                            Under Review
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Summary note if present */}
                {feedback?.summery && (
                  <div className="mt-4 pt-4 border-t border-line text-xs text-ink-muted leading-relaxed">
                    <p className="line-clamp-2">
                      <strong className="text-ink font-medium">Evaluation note: </strong>
                      {typeof feedback.summery === 'string'
                        ? feedback.summery
                        : Array.isArray(feedback.summery)
                        ? feedback.summery.join(' ')
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
