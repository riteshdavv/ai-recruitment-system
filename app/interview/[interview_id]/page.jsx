'use client';
import React, { useEffect, useState, useContext } from 'react';
import Image from 'next/image';
import Logo from '@/components/Logo';
import { Clock, Mic, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Volume2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';
import { InterviewDataContext } from '@/context/InterviewDataContext';
import { useUser } from '@/app/provider';

function Interview() {
  const params = useParams();
  const interview_id = params?.interview_id;
  const [interviewData, setInterviewData] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [micTested, setMicTested] = useState(false);
  const [micTesting, setMicTesting] = useState(false);
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (interview_id) getInterviewDetails();
  }, [interview_id]);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setAccessDenied(false);
    };
    checkAccess();
  }, [interviewData, interview_id, router]);

  useEffect(() => {
    if (user && !userEmail) setUserEmail(user.email || '');
    if (user && !userName) setUserName(user.name || '');
  }, [user]);

  const getInterviewDetails = async () => {
    setLoading(true);
    try {
      const { data: interviews, error } = await supabase
        .from('Interviews')
        .select('userEmail, jobPosition, jobDescription, duration, type, questionList')
        .eq('interview_id', interview_id);

      if (error) throw error;
      if (!interviews?.length) throw new Error('Interview role not found');
      
      setInterviewData(interviews[0]);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch interview details');
    } finally {
      setLoading(false);
    }
  };

  const testMicrophone = async () => {
    setMicTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicTested(true);
      toast.success("Microphone access verified");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      toast.error("Microphone permission denied. Please allow microphone in browser.");
    } finally {
      setMicTesting(false);
    }
  };

  const validateJoin = () => {
    if (!userName.trim()) {
      toast.warning("Full name is required");
      return false;
    }
    if (userName.trim().split(" ").length < 2) {
      toast.warning("Please provide both first and last name");
      return false;
    }
    return true;
  };

  const onJoinInterview = async () => {
    if (!validateJoin()) return;

    try {
      const newInterviewInfo = {
        ...interviewInfo,
        candidate_name: userName,
        jobPosition: interviewData?.jobPosition,
        jobDescription: interviewData?.jobDescription,
        duration: interviewData?.duration,
        userEmail: userEmail,
        type: interviewData?.type,
        questionList: interviewData?.questionList,
        interview_id: interview_id,
      };
      setInterviewInfo(newInterviewInfo);

      if (typeof window !== 'undefined') {
        localStorage.setItem('interviewInfo', JSON.stringify(newInterviewInfo));
      }
      toast.success("Connecting session audio...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push(`/interview/${interview_id}/start`);
    } catch (error) {
      toast.error("Failed to connect session");
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center p-6">
        <div className="bg-surface rounded-lg border border-line p-8 max-w-md text-center shadow-card space-y-3">
          <div className="w-12 h-12 rounded-full bg-danger-soft text-danger mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-semibold text-ink">Access Denied</h2>
          <p className="text-sm text-ink-muted">Please sign in with authorized credentials to access this interview session.</p>
          <Button onClick={() => router.push('/login')} className="bg-sage-700 hover:bg-sage-800 text-white w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50 py-12 px-4 sm:px-6">
      {/* 720px focused column as per Section 6.1 */}
      <div className="max-w-[720px] mx-auto space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <Logo size="md" />
          <div className="flex items-center gap-1.5 text-xs text-ink-muted font-mono">
            <ShieldCheck className="w-4 h-4 text-sage-600" />
            <span>Encrypted Session</span>
          </div>
        </div>

        {/* Role Briefing Card */}
        <div className="bg-surface rounded-lg border border-line p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-sage-700">Interview Session</span>
              <h1 className="text-2xl font-semibold text-ink mt-0.5">
                {interviewData?.jobPosition || "Voice Assessment"}
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-ink-muted bg-sage-100 border border-sage-200 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 text-sage-700" />
              <span>{interviewData?.duration || "15 Min"}</span>
            </div>
          </div>

          {interviewData?.jobDescription && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">Role Overview</h3>
              <p className="text-xs sm:text-sm text-ink leading-relaxed line-clamp-3 bg-surface-alt p-3.5 rounded border border-line">
                {interviewData.jobDescription}
              </p>
            </div>
          )}

          {/* Pre-flight verification checklist as per Section 6.1 */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Pre-flight System Check</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-md border border-line bg-surface-alt flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-sage-700" />
                  <span className="text-ink font-medium">Microphone Sensor</span>
                </div>
                <button
                  type="button"
                  onClick={testMicrophone}
                  disabled={micTesting}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    micTested
                      ? 'bg-success-soft text-success border border-success/20'
                      : 'bg-surface border border-line hover:bg-sage-100 text-ink'
                  }`}
                >
                  {micTested ? 'Verified' : micTesting ? 'Testing...' : 'Test Mic'}
                </button>
              </div>

              <div className="p-3.5 rounded-md border border-line bg-surface-alt flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-sage-700" />
                  <span className="text-ink font-medium">Audio Output</span>
                </div>
                <span className="text-xs font-mono text-sage-800 bg-sage-100 border border-sage-200 px-2 py-0.5 rounded">
                  System Ready
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Form Fields */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Full Name (First and Last)
              </label>
              <Input
                placeholder="e.g. Jordan Smith"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="jordan@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Consent Notice as per Section 6.1 */}
          <div className="p-3 rounded-md bg-sage-50 border border-line text-xs text-ink-muted leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
            <span>
              By continuing, you consent to an automated conversational voice interview and dialogue transcription evaluated by AI models for hiring criteria.
            </span>
          </div>

          {/* Single primary CTA as per Section 6.1 */}
          <div className="pt-2">
            <Button
              onClick={onJoinInterview}
              disabled={loading || !userName || !userEmail}
              className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white rounded-md text-base font-medium shadow-card"
            >
              Start Interview Session
              <ArrowRight className="w-4 h-4 ml-2" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Interview;
