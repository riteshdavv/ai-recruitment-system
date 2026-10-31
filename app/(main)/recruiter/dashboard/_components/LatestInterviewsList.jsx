"use client";
import { Video, ArrowRight, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { useUser } from "@/app/provider";
import InterviewCard from "./interviewcard";
import Link from "next/link";

function LatestInterviewsList() {
  const router = useRouter();
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

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
      const { data: interviews, error } = await supabase
        .from("Interviews")
        .select("*")
        .eq("userEmail", user?.email)
        .order('id', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (!interviews || interviews.length === 0) {
        setInterviewList([]);
        return;
      }

      const interviewIds = interviews.map((i) => i.interview_id).filter(Boolean);
      let resultsByInterview = {};

      if (interviewIds.length > 0) {
        const { data: results, error: resultsError } = await supabase
          .from("interview_results")
          .select("*")
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

  const handleInterviewDelete = () => {
    getInterviewList();
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Recent Interviews</h2>
          <p className="text-xs text-ink-muted mt-0.5">Active voice interview pipelines and candidates</p>
        </div>
        {interviewList.length > 0 && (
          <Link
            href="/recruiter/scheduled-interview"
            className="text-sm font-medium text-sage-700 hover:text-sage-800 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-surface rounded-lg border border-line animate-pulse p-5" />
          ))}
        </div>
      ) : interviewList.length === 0 ? (
        <div className="bg-surface border border-dashed border-line rounded-lg p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 mb-3">
            <Video className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h3 className="font-semibold text-ink text-base mb-1">No interviews created yet</h3>
          <p className="text-sm text-ink-muted max-w-sm mb-4">
            Create your first AI interview to begin screening applicants with interactive voice agents.
          </p>
          <Button
            onClick={() => router.push("/recruiter/dashboard/create-interview")}
            className="h-10 bg-sage-700 hover:bg-sage-800 text-white rounded-md text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={2} />
            Create Interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {interviewList.map((interview, index) => (
            <InterviewCard
              interview={interview}
              key={index}
              onDelete={handleInterviewDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LatestInterviewsList;
