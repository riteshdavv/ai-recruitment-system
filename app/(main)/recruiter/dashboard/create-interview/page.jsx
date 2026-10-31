'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FormContainer from './_components/FormContainer';
import QuestionList from './_components/QuestionList';
import { toast } from 'sonner';
import InterviewLink from './_components/InterviewLink';
import { useUser } from '@/app/provider';

function CreateInterview() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [interviewId, setInterviewId] = useState();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.credits <= 0) {
      toast.error("You don't have enough credits to create an interview");
      router.push('/recruiter/billing');
    }
  }, [user, router]);

  const onHandleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev, 
      [field]: value
    }));
  };

  const onGoToNext = () => {
    if (user?.credits <= 0) {
      toast.error("Please purchase credits to create an interview");
      router.push('/recruiter/billing');
      return;
    }

    let missingField = '';
    if (!formData.jobPosition) missingField = 'Job Position';
    else if (!formData.jobDescription) missingField = 'Job Description';
    else if (!formData.duration) missingField = 'Duration';
    else if (!formData.type) missingField = 'Interview Type';

    if (missingField) {
      toast.error(`${missingField} is required`);
      return;
    }
    
    setStep(step + 1);
  };

  const onCreateLink = async (interview_id) => {
    setLoading(true);
    if (user?.credits <= 0) {
      toast.error("Please purchase credits to create an interview");
      router.push('/recruiter/billing');
      setLoading(false);
      return;
    }

    try {
      setInterviewId(interview_id);
      setStep(step + 1);
    } catch (error) {
      toast.error("Failed to create interview link");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Role Details" },
    { num: 2, label: "Question Set" },
    { num: 3, label: "Share Link" },
  ];

  return (
    <div className="max-w-[640px] mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else router.back();
          }}
          className="p-2 rounded-md border border-line bg-surface hover:bg-sage-100 text-ink-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Create Interview Role</h1>
          <p className="text-xs text-ink-muted">Configure your AI interviewer parameters and review criteria</p>
        </div>
      </div>

      {/* Stepper as defined in Section 6.4 */}
      <div className="bg-surface rounded-lg border border-line p-4 shadow-card">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-6 right-6 top-3.5 -translate-y-1/2 h-[2px] bg-line -z-0" />
          {steps.map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-1.5 relative z-10 bg-surface px-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold transition-all ${
                    isDone
                      ? "bg-sage-700 text-white"
                      : isCurrent
                      ? "bg-sage-700 text-white ring-2 ring-sage-700 ring-offset-2 ring-offset-surface"
                      : "bg-sage-200 text-ink-muted"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : s.num}
                </div>
                <span className={`text-xs font-medium ${isCurrent ? "text-ink font-semibold" : "text-ink-muted"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Balance reminder */}
      {user && (
        <div className="bg-surface-alt border border-line rounded-lg p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-muted">
            <Coins className="w-4 h-4 text-sage-600" />
            <span>Available credits: <strong className="font-mono text-ink font-semibold">{user.credits || 0}</strong></span>
          </div>
          <span className="font-mono text-sage-800 bg-sage-100 border border-sage-200 px-2 py-0.5 rounded-full">
            Cost: 1 credit
          </span>
        </div>
      )}

      {/* Step Components */}
      {step === 1 && (
        <FormContainer
          onHandleInputChange={onHandleInputChange} 
          GoToNext={onGoToNext}
        />
      )}
      
      {step === 2 && (
        <QuestionList 
          formData={formData} 
          onCreateLink={onCreateLink}
          loading={loading}
        />
      )}
      
      {step === 3 && (
        <InterviewLink 
          interview_id={interviewId}
          formData={formData} 
        />
      )}
    </div>
  );
}

export default CreateInterview;
