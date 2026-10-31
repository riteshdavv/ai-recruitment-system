import React, { useState, useEffect } from "react";
import moment from "moment";
import CandidateListFeedbackDialog from "./CandidateFeedbackDialog";
import exportToCSV from "@/lib/exportToCSV";
import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import { Download, Users, Star, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

function CandidateList({ candidateList }) {
  const [candidatesWithPictures, setCandidatesWithPictures] = useState([]);

  const calculateRating = (candidate) => {
    const rating = candidate?.conversation_transcript?.feedback?.rating;
    if (!rating) return null;

    const values = Object.values(rating).filter(val => typeof val === "number");
    if (!values.length) return null;

    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  useEffect(() => {
    const fetchCandidatePictures = async () => {
      if (!candidateList || candidateList.length === 0) return;

      try {
        const candidatesWithPics = await Promise.all(
          candidateList.map(async (candidate) => {
            if (!candidate?.email) return candidate;

            try {
              const { data: userData } = await supabase
                .from('users')
                .select('picture')
                .eq('email', candidate.email)
                .single();

              if (userData?.picture) {
                return { ...candidate, picture: userData.picture };
              }
            } catch (error) {
              console.error('Error fetching candidate picture:', error);
            }

            return candidate;
          })
        );

        setCandidatesWithPictures(candidatesWithPics);
      } catch (error) {
        console.error('Error fetching candidate pictures:', error);
        setCandidatesWithPictures(candidateList);
      }
    };

    fetchCandidatePictures();
  }, [candidateList]);

  return (
    <div className="bg-surface rounded-lg border border-line shadow-card overflow-hidden">
      {/* Header bar */}
      <div className="p-5 sm:p-6 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
            <span>Interviewed Candidates</span>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-900 border border-sage-200">
              {candidateList?.length || 0}
            </span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">Automated evaluations, score breakdowns, and dialogue transcripts</p>
        </div>

        {candidateList?.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(candidateList)}
            className="text-xs font-medium self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
            Export CSV
          </Button>
        )}
      </div>

      {/* Candidate Table or Empty State */}
      {!candidateList || candidateList.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center mb-3">
            <Users className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="font-semibold text-ink text-base mb-1">No candidate interviews yet</h3>
          <p className="text-sm text-ink-muted max-w-sm">
            Share the interview link with candidates. Once a session completes, their transcript and rating will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sage-100 text-xs font-medium text-ink-muted border-b border-line">
                <th className="py-3 px-5">Candidate</th>
                <th className="py-3 px-5">Email</th>
                <th className="py-3 px-5">Completed Date</th>
                <th className="py-3 px-5 text-right">Overall Score</th>
                <th className="py-3 px-5 text-right">Assessment Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm text-ink">
              {candidatesWithPictures.map((candidate, index) => {
                const score = calculateRating(candidate);
                const feedback = candidate?.conversation_transcript?.feedback;
                const isRecommended = feedback?.Recommendation
                  ? !feedback.Recommendation.toLowerCase().includes('not')
                  : null;

                return (
                  <tr key={index} className="hover:bg-sage-50 transition-colors h-14">
                    <td className="py-3 px-5 font-medium">
                      <div className="flex items-center gap-3">
                        {candidate?.picture ? (
                          <Image
                            src={candidate.picture}
                            alt={candidate?.fullname || "Candidate"}
                            width={34}
                            height={34}
                            className="rounded-full object-cover ring-1 ring-line shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-sage-200 text-sage-900 font-semibold text-xs flex items-center justify-center shrink-0">
                            {candidate?.fullname?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="font-semibold text-ink">
                          {candidate?.fullname || "Unnamed Candidate"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-5 text-ink-muted text-xs font-mono">
                      {candidate?.email || "—"}
                    </td>

                    <td className="py-3 px-5 text-ink-muted text-xs font-mono">
                      {moment(candidate?.completed_at || candidate?.created_at).format("MMM DD, YYYY")}
                    </td>

                    <td className="py-3 px-5 text-right font-mono tabular-nums">
                      {score !== null ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-xs text-sage-900 bg-sage-100 border border-sage-200 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 text-sage-700" strokeWidth={2} />
                          {score}/10
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>

                    <td className="py-3 px-5 text-right">
                      <CandidateListFeedbackDialog candidate={candidate} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CandidateList;
