'use client';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/app/provider';
import { supabase } from '@/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Video, Calendar, Clock, Star, CheckCircle, ArrowRight } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';

export default function RecentInterviews() {
  const { user } = useUser();
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchRecentInterviews();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user]);

  const fetchRecentInterviews = async () => {
    try {
      setLoading(true);
      const { data: results, error } = await supabase
        .from('interview_results')
        .select('*')
        .eq('email', user.email)
        .order('completed_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      if (!results || results.length === 0) {
        setRecentInterviews([]);
        return;
      }

      const interviewIds = [...new Set(results.map((r) => r.interview_id).filter(Boolean))];
      let interviewsMap = {};

      if (interviewIds.length > 0) {
        const { data: interviewsData } = await supabase
          .from('Interviews')
          .select('interview_id, jobPosition, jobDescription, type, duration, created_at')
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

      setRecentInterviews(combined);
    } catch (error) {
      console.error('Error fetching recent interviews:', error?.message || error);
      setRecentInterviews([]);
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
    <div className="bg-surface rounded-lg border border-line shadow-card p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-ink">Recent Interview History</h3>
          <p className="text-xs text-ink-muted mt-0.5">Your completed sessions, transcript records, and feedback</p>
        </div>
        {recentInterviews.length > 0 && (
          <Link href="/candidate/interviews">
            <Button variant="ghost" size="sm" className="text-xs font-medium text-sage-700 hover:text-sage-800 hover:bg-sage-100 flex items-center gap-1 group">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-surface-alt border border-line rounded-md animate-pulse" />
          ))}
        </div>
      ) : recentInterviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-line">
          <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center mb-2.5">
            <Video className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium text-ink">No interviews completed yet</p>
          <p className="text-xs text-ink-muted mt-0.5 max-w-xs">
            Enter an interview code above to begin your first voice evaluation session.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentInterviews.map((result) => {
            const score = result.conversation_transcript?.feedback
              ? calculateOverallScore(result.conversation_transcript.feedback)
              : null;
            const feedback = result.conversation_transcript?.feedback;
            const isRecommended = feedback?.Recommendation
              ? !feedback.Recommendation.toLowerCase().includes('not')
              : null;

            return (
              <div
                key={result.id}
                className="bg-surface rounded-md border border-line p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-sage-300 transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="font-medium text-sm text-ink truncate">
                    {result.Interviews?.jobPosition || 'Interview Session'}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {moment(result.completed_at || result.created_at).format('MMM DD, YYYY')}
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
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {score !== null && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-900 border border-sage-200 tabular-nums">
                      <Star className="w-3 h-3 text-sage-700" strokeWidth={2} />
                      {score}/10
                    </span>
                  )}
                  {isRecommended !== null && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        isRecommended
                          ? 'bg-success-soft text-success border border-success/20'
                          : 'bg-danger-soft text-danger border border-danger/20'
                      }`}
                    >
                      {isRecommended ? 'Recommended' : 'Needs Review'}
                    </span>
                  )}
                  {score === null && isRecommended === null && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-success-soft text-success border border-success/20">
                      <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
