"use client";
import { supabase } from "@/services/supabaseClient";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useUser } from "@/app/provider";
import InterviewDetailContainer from "./_components/InteviewDetailContainer";
import CandidateList from "./_components/CandidateList";

function InterviewDetail() {
  const { interview_id } = useParams();
  const { user } = useUser();
  const [interviewDetail, setInterviewDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      GetInterviewDetail();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user]);

  const GetInterviewDetail = async () => {
    try {
      setLoading(true);
      const { data: interviewData, error: interviewError } = await supabase
        .from("Interviews")
        .select("jobPosition, jobDescription, type, questionList, duration, interview_id, created_at")
        .eq("userEmail", user.email)
        .eq("interview_id", interview_id);

      if (interviewError) throw interviewError;

      if (!interviewData || interviewData.length === 0) {
        setInterviewDetail(null);
        return;
      }

      const { data: resultsData, error: resultsError } = await supabase
        .from("interview_results")
        .select("email, fullname, conversation_transcript, recommendations, interview_id, completed_at")
        .eq("interview_id", interview_id);

      if (resultsError) {
        console.error("Error fetching candidate results:", resultsError?.message || resultsError);
      }

      const fullDetail = {
        ...interviewData[0],
        interview_results: resultsData || [],
      };

      setInterviewDetail(fullDetail);
    } catch (err) {
      console.error("Error fetching interview details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-5 animate-pulse">
        <div className="h-8 bg-surface rounded w-64 border border-line" />
        <div className="h-44 bg-surface rounded-lg border border-line" />
        <div className="h-64 bg-surface rounded-lg border border-line" />
      </div>
    );
  }

  if (error) {
    return <div className="mt-5 text-red-500">Error: {error}</div>;
  }

  if (!interviewDetail) {
    return <div className="mt-5">No interview found</div>;
  }

  return (
    <div className="mt-5 space-y-6">
      <h2 className="font-bold text-2xl">Interview Details</h2>
      <InterviewDetailContainer interviewDetail={interviewDetail} />
      <CandidateList 
        candidateList={interviewDetail["interview_results"] || []} 
      />
    </div>
  );
}

export default InterviewDetail;