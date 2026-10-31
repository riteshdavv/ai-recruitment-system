"use client";
import { useUser } from "@/app/provider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { Video, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import InterviewCard from "../dashboard/_components/interviewcard";
import { useRouter } from "next/navigation";

function ScheduledInterview() {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user?.email) {
      getInterviewList();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user]);

  const getInterviewList = async () => {
    setLoading(true);
    try {
      const { data: interviews, error: interviewsError } = await supabase
        .from("Interviews")
        .select("jobPosition, duration, interview_id, created_at")
        .eq("userEmail", user?.email)
        .order("id", { ascending: false });

      if (interviewsError) throw interviewsError;

      if (!interviews || interviews.length === 0) {
        setInterviewList([]);
        return;
      }

      const interviewIds = interviews.map((i) => i.interview_id).filter(Boolean);
      let resultsByInterview = {};

      if (interviewIds.length > 0) {
        const { data: results, error: resultsError } = await supabase
          .from("interview_results")
          .select("interview_id, email, conversation_transcript, completed_at")
          .in("interview_id", interviewIds);

        if (!resultsError && results) {
          resultsByInterview = results.reduce((acc, curr) => {
            if (!acc[curr.interview_id]) acc[curr.interview_id] = [];
            acc[curr.interview_id].push(curr);
            return acc;
          }, {});
        }
      }

      const combined = interviews.map((inv) => ({
        ...inv,
        interview_results: resultsByInterview[inv.interview_id] || [],
      }));

      setInterviewList(combined);
    } catch (err) {
      console.error("Error fetching interviews:", err?.message || err);
      setInterviewList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Scheduled Interviews</h1>
          <p className="text-ink-muted text-sm mt-1">Review applicant responses, AI ratings, and live interview status</p>
        </div>
        <Button
          onClick={() => router.push("/recruiter/dashboard/create-interview")}
          className="bg-sage-700 hover:bg-sage-800 text-white rounded-md hidden md:flex items-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Create Interview
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-surface rounded-lg border border-line animate-pulse p-5" />
          ))}
        </div>
      ) : interviewList?.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-lg p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 mb-3">
            <Video className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="font-semibold text-ink text-base mb-1">No scheduled interviews found</h3>
          <p className="text-ink-muted text-sm mb-4 max-w-sm">
            Generate your first interview link and candidates will populate here after completing their voice call.
          </p>
          <Button
            onClick={() => router.push("/recruiter/dashboard/create-interview")}
            className="bg-sage-700 hover:bg-sage-800 text-white rounded-md"
          >
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={2} />
            Create Interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {interviewList?.map((interview, index) => (
            <InterviewCard
              interview={interview}
              key={index}
              viewDetail={true}
              onDelete={getInterviewList}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ScheduledInterview;
