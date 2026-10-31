import { Calendar, Clock, MessageCircleQuestionIcon, Trash2 } from "lucide-react";
import moment from "moment";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

function InterviewDetailContainer({ interviewDetail }) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const parsedQuestions = (() => {
    const raw = interviewDetail?.questionList;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.interviewQuestions)) return parsed.interviewQuestions;
      return [];
    } catch {
      return [];
    }
  })();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error: resultsError } = await supabase
        .from('interview_results')
        .delete()
        .eq('interview_id', interviewDetail.interview_id);

      if (resultsError) {
        console.error('Error deleting interview results:', resultsError);
      }

      const { error: interviewError } = await supabase
        .from('Interviews')
        .delete()
        .eq('interview_id', interviewDetail.interview_id);

      if (interviewError) {
        throw interviewError;
      }

      toast.success("Interview role deleted successfully");
      setShowDeleteAlert(false);
      router.push('/recruiter/dashboard');
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error("Failed to delete interview");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-surface rounded-lg border border-line shadow-card p-5 sm:p-6 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-sage-700">Interview Specification</span>
            <h1 className="text-2xl font-semibold text-ink mt-0.5">{interviewDetail?.jobPosition}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteAlert(true)}
            className="text-danger border-line hover:bg-danger-soft hover:text-danger hover:border-danger/20 self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4 mr-1.5" strokeWidth={1.75} />
            Delete Interview
          </Button>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md bg-surface-alt border border-line text-sm">
          <div>
            <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Duration</span>
            <span className="font-semibold text-ink flex items-center gap-1.5 font-mono">
              <Clock className="w-4 h-4 text-sage-600" strokeWidth={1.75} />
              {interviewDetail?.duration || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Created Date</span>
            <span className="font-semibold text-ink flex items-center gap-1.5 font-mono">
              <Calendar className="w-4 h-4 text-sage-600" strokeWidth={1.75} />
              {moment(interviewDetail?.created_at).format("MMM DD, YYYY")}
            </span>
          </div>

          {interviewDetail?.type && (
            <div>
              <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Interview Format</span>
              <span className="font-medium text-ink bg-sage-100 text-sage-900 border border-sage-200 px-2 py-0.5 rounded-full text-xs inline-block">
                {(() => {
                  try {
                    const parsed = JSON.parse(interviewDetail.type);
                    return Array.isArray(parsed) ? parsed[0] : interviewDetail.type;
                  } catch {
                    return interviewDetail.type;
                  }
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Job Description</h3>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap rounded-md bg-surface border border-line p-4">
            {interviewDetail?.jobDescription || "No description provided."}
          </p>
        </div>

        {/* Interview Questions */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
            Pre-configured AI Question Set ({parsedQuestions.length})
          </h3>
          <div className="space-y-2">
            {parsedQuestions.map((item, index) => (
              <div
                key={index}
                className="p-3.5 bg-surface-alt rounded-md border border-line text-sm text-ink flex items-start gap-3"
              >
                <span className="font-mono text-xs font-semibold text-sage-700 bg-sage-100 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                  Q{index + 1}
                </span>
                <p className="leading-relaxed">
                  {item?.question || item?.Interviewquestion || (typeof item === 'string' ? item : '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role & Responses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently remove <strong className="text-ink">{interviewDetail?.jobPosition}</strong>? 
              All candidate recordings, transcripts, and evaluation metrics will be deleted irreversibly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InterviewDetailContainer;
