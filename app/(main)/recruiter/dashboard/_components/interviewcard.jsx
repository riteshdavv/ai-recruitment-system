import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Send, Trash2, Calendar, Clock, Users } from "lucide-react";
import moment from "moment";
import React, { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function InterviewCard({ interview, viewDetail = false, onDelete }) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getInterviewUrl = () => {
    const baseUrl = (process.env.NEXT_PUBLIC_HOST_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
    return `${baseUrl}/interview/${interview?.interview_id}`;
  };

  const copyLink = async () => {
    try {
      const url = getInterviewUrl();
      await navigator.clipboard.writeText(url);
      toast.success("Interview link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
      console.error("Failed to copy: ", err);
    }
  };

  const onSend = () => {
    const interviewUrl = getInterviewUrl();
    window.location.href = `mailto:?subject=Interview Invitation: ${encodeURIComponent(interview?.jobPosition || "Position")}&body=Hello,%0D%0A%0D%0AYour AI interview session is ready. Please access the following link when prepared:%0D%0A${encodeURIComponent(interviewUrl)}%0D%0A%0D%0ABest regards`;
    toast.success("Email client opened with pre-filled link");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error: resultsError } = await supabase
        .from('interview_results')
        .delete()
        .eq('interview_id', interview.interview_id);

      if (resultsError) {
        console.error('Error deleting interview results:', resultsError);
      }

      const { error: interviewError } = await supabase
        .from('Interviews')
        .delete()
        .eq('interview_id', interview.interview_id);

      if (interviewError) {
        throw interviewError;
      }

      toast.success("Interview deleted successfully");
      setShowDeleteAlert(false);
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error("Failed to delete interview");
    } finally {
      setDeleting(false);
    }
  };

  const candidateCount = interview?.interview_results?.length || 0;

  return (
    <>
      <div className="bg-surface rounded-lg border border-line p-5 shadow-card hover:border-sage-300 hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          {/* Top meta row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sage-500" />
              <span className="text-xs font-mono text-ink-muted">
                {moment(interview?.created_at).format("MMM DD, YYYY")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-info-soft text-info border border-info/20">
                Active
              </span>
              <button
                onClick={() => setShowDeleteAlert(true)}
                className="p-1 rounded text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                title="Delete interview"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Job Position Title */}
          <h3 className="text-lg font-semibold text-ink leading-snug line-clamp-1 mb-2">
            {interview?.jobPosition || "Interview Role"}
          </h3>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mb-4">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              {interview?.duration || "15 Min"}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 bg-sage-100 text-sage-900 px-2 py-0.5 rounded-full font-mono tabular-nums">
              <Users className="w-3.5 h-3.5 text-sage-700" strokeWidth={1.75} />
              {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!viewDetail ? (
          <div className="flex items-center gap-2 pt-3 border-t border-line mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs font-medium"
              onClick={copyLink}
            >
              <Copy className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} />
              Copy Link
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 bg-sage-700 hover:bg-sage-800 text-white text-xs font-medium"
              onClick={onSend}
            >
              <Send className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} />
              Share
            </Button>
          </div>
        ) : (
          <div className="pt-3 border-t border-line mt-2">
            <Link href={`/recruiter/scheduled-interview/${interview?.interview_id}/details`} className="w-full block">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 justify-between text-xs font-medium group"
              >
                <span>Review Candidates & Transcripts</span>
                <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the interview for <strong className="text-ink">{interview?.jobPosition}</strong>? 
              This will permanently delete the role, {candidateCount} candidate responses, transcripts, and evaluation ratings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleting}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              {deleting ? "Deleting..." : "Delete Interview"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InterviewCard;
