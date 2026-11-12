import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { Download, Star, CheckCircle, AlertTriangle, FileText, Mail, XCircle, MessageSquare } from "lucide-react";
import Image from "next/image";
import CandidateDecisionEmailDialog from "./CandidateDecisionEmailDialog";

function CandidateFeedbackDialog({ candidate }) {
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [cvAvailable, setCvAvailable] = useState(false);
  const [cvFilePath, setCvFilePath] = useState(null);
  const [candidatePicture, setCandidatePicture] = useState(null);

  const feedback = candidate?.conversation_transcript?.feedback || {};

  const rating = feedback?.rating || {
    TechnicalSkills: 0,
    Communication: 0,
    ProblemSolving: 0,
    Experience: 0,
    Behavioral: 0,
    Thinking: 0,
  };

  const recommendationMessage =
    feedback?.RecommendationMessage ||
    feedback?.recommendationMessage ||
    feedback?.["Recommendation Message"] ||
    "No recommendation details provided.";

  const rawSummary =
    feedback?.summary ||
    feedback?.summery ||
    feedback?.Summary ||
    feedback?.Summery ||
    feedback?.synthesis ||
    feedback?.observations ||
    feedback?.overview ||
    candidate?.conversation_transcript?.summary ||
    candidate?.conversation_transcript?.summery ||
    "";

  const ratings = Object.values(rating).filter((val) => typeof val === "number");
  const overallScore =
    ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

  // Score-driven recommendation classification (Score strictly dictates verdict)
  let recommendationStatus;
  let displayRecommendationTitle;
  let finalRecommendationMessage;

  if (overallScore >= 7) {
    recommendationStatus = "recommended";
    displayRecommendationTitle = "Recommended Candidate";
    if (
      !recommendationMessage ||
      recommendationMessage === "No recommendation details provided." ||
      recommendationMessage.toLowerCase().includes("not recommended") ||
      recommendationMessage.toLowerCase().includes("insufficient") ||
      recommendationMessage.toLowerCase().includes("minimal")
    ) {
      finalRecommendationMessage =
        "Candidate demonstrated solid technical competencies, clear communication, and strong qualifications across evaluated domains.";
    } else {
      finalRecommendationMessage = recommendationMessage;
    }
  } else if (overallScore <= 4) {
    recommendationStatus = "not_recommended";
    displayRecommendationTitle = "Not Recommended";
    if (
      !recommendationMessage ||
      recommendationMessage === "No recommendation details provided." ||
      (recommendationMessage.toLowerCase().includes("recommended") && !recommendationMessage.toLowerCase().includes("not"))
    ) {
      finalRecommendationMessage =
        "Candidate did not demonstrate sufficient technical depth or evidence to warrant advancing at this stage.";
    } else {
      finalRecommendationMessage = recommendationMessage;
    }
  } else {
    recommendationStatus = "review";
    displayRecommendationTitle = "Under Review / Follow-up Needed";
    finalRecommendationMessage =
      recommendationMessage && recommendationMessage !== "No recommendation details provided."
        ? recommendationMessage
        : "Moderate performance demonstrating partial competencies; recommended for a technical follow-up session.";
  }

  const isRecommended = recommendationStatus === "recommended";
  const isNotRecommended = recommendationStatus === "not_recommended";

  const summaryArray = Array.isArray(rawSummary)
    ? rawSummary
    : typeof rawSummary === "string" && rawSummary.trim()
    ? rawSummary.split("\n").filter((line) => line.trim())
    : finalRecommendationMessage
    ? [finalRecommendationMessage]
    : [];

  const transcriptList =
    candidate?.conversation_transcript?.transcript ||
    candidate?.conversation_transcript?.conversation ||
    candidate?.conversation_transcript?.dialogue ||
    [];

  const getQualitativeFeedback = (score) => {
    if (score >= 8) return "Strong";
    if (score >= 5) return "Proficient";
    return "Needs Development";
  };

  const fetchCandidateCV = async () => {
    if (!candidate?.email) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('cv_file_path, picture')
        .eq('email', candidate.email)
        .single();

      if (error) return;

      if (userData?.cv_file_path) {
        setCvFilePath(userData.cv_file_path);
        setCvAvailable(true);
      }

      if (userData?.picture) {
        setCandidatePicture(userData.picture);
      }
    } catch (error) {
      console.error('Error fetching candidate CV:', error);
    }
  };

  const downloadCV = async () => {
    if (!cvFilePath) {
      toast.error('CV not available');
      return;
    }

    setDownloadingCV(true);
    try {
      // 1. Try public URL fetch
      const { data: publicData } = supabase.storage
        .from('cv-uploads')
        .getPublicUrl(cvFilePath);

      if (publicData?.publicUrl) {
        try {
          const res = await fetch(publicData.publicUrl);
          if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${candidate?.fullname || 'candidate'}_CV.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('CV downloaded successfully');
            return;
          }
        } catch (fetchErr) {
          console.warn('Public fetch failed, trying download fallback:', fetchErr);
        }
      }

      // 2. Fallback to download()
      const { data, error } = await supabase.storage
        .from('cv-uploads')
        .download(cvFilePath);

      if (!error && data) {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${candidate?.fullname || 'candidate'}_CV.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('CV downloaded successfully');
        return;
      }

      // 3. Fallback: signed URL
      const { data: signedData } = await supabase.storage
        .from('cv-uploads')
        .createSignedUrl(cvFilePath, 60);

      if (signedData?.signedUrl) {
        window.open(signedData.signedUrl, '_blank');
        toast.success('Opening CV download link');
        return;
      }

      throw error || new Error('Failed to retrieve file');
    } catch (error) {
      console.error('Error downloading CV:', error);
      // Last resort: open public URL directly in new tab
      const { data } = supabase.storage.from('cv-uploads').getPublicUrl(cvFilePath);
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
        toast.info('Opened CV in new tab');
      } else {
        toast.error('Failed to download CV');
      }
    } finally {
      setDownloadingCV(false);
    }
  };

  React.useEffect(() => {
    if (candidate?.email) {
      fetchCandidateCV();
    }
  }, [candidate?.email]);

  const emailTemplates = {
    selected: `Subject: Invitation to Next Interview Stage: ${candidate?.jobPosition || "Role"}

Dear ${candidate?.fullname || "Candidate"},

Thank you for completing your voice AI assessment session. We were impressed with your background and responses, and would like to invite you forward to the next stage in our evaluation process.

Key Evaluation Summary:
${Object.entries(rating)
  .map(
    ([skill, score]) =>
      `• ${skill.replace(/([A-Z])/g, " $1").trim()}: ${score}/10 (${getQualitativeFeedback(score)})`
  )
  .join("\n")}

Our recruiting team will follow up shortly with scheduling options.

Sincerely,
Hiring Team`,

    rejected: `Subject: Update Regarding Your Application for ${candidate?.jobPosition || "the position"}

Dear ${candidate?.fullname || "Candidate"},

Thank you for completing your interview assessment for the ${candidate?.jobPosition || "the position"} role.

While your profile has merits, we have decided to advance other candidates whose current skill alignment more closely fits this position's immediate needs.

We appreciate the time you dedicated to interviewing with us and wish you continued success.

Sincerely,
Hiring Team`,

    reevaluate: `Subject: Follow-up on Your Interview Assessment for ${candidate?.jobPosition || "the position"}

Dear ${candidate?.fullname || "Candidate"},

Thank you for completing the initial voice interview for the ${candidate?.jobPosition || "the position"} role. We would like to schedule a brief follow-up discussion to explore a few aspects of your experience in greater detail.

Please let us know your general availability over the upcoming days.

Sincerely,
Hiring Team`,
  };

  const [decisionDialog, setDecisionDialog] = useState({
    isOpen: false,
    decisionType: "selected",
    initialSubject: "",
    initialMessage: "",
  });

  const handleOpenDecisionDialog = (templateType) => {
    const rawTemplate = emailTemplates[templateType] || "";
    const lines = rawTemplate.split("\n");
    const subject = lines[0]?.replace("Subject: ", "").trim() || "";
    const body = lines.slice(1).join("\n").trim();

    setDecisionDialog({
      isOpen: true,
      decisionType: templateType,
      initialSubject: subject,
      initialMessage: body,
    });
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs font-medium">
            View Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-ink">
            Candidate Assessment Report
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-4 space-y-6 text-left">
              {/* Header profile card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-alt border border-line">
                <div className="flex items-center gap-3.5">
                  {candidatePicture ? (
                    <Image
                      src={candidatePicture}
                      alt={candidate?.fullname || "Candidate"}
                      width={44}
                      height={44}
                      className="rounded-full ring-1 ring-line object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-sage-200 text-sage-900 font-semibold text-sm flex items-center justify-center shrink-0">
                      {candidate?.fullname?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-ink text-base">
                      {candidate?.fullname || "Unnamed Candidate"}
                    </h3>
                    <p className="text-xs font-mono text-ink-muted">
                      {candidate?.email || "No email recorded"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-xs text-ink-muted uppercase tracking-wider block">Score</span>
                    <span className="text-2xl font-semibold text-sage-800 font-mono tabular-nums leading-none">
                      {overallScore}/10
                    </span>
                  </div>

                  {cvAvailable && (
                    <Button
                      onClick={downloadCV}
                      disabled={downloadingCV}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs font-medium border-line"
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-sage-700" />
                      {downloadingCV ? "Downloading..." : "Resume"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Skills Assessment Grid */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                  Evaluated Competencies
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-4 rounded-lg bg-surface border border-line">
                  {Object.entries(rating).map(([skill, score]) => (
                    <div key={skill} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-ink">{skill.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="font-mono text-sage-800 tabular-nums">{score}/10</span>
                      </div>
                      <Progress value={score * 10} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Performance Summary */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                  AI Synthesis & Observations
                </h4>
                <div className="p-4 rounded-lg bg-sage-50 border border-line text-sm text-ink leading-relaxed">
                  {summaryArray.length > 0 ? (
                    summaryArray.map((line, index) => (
                      <p key={index} className="mb-2 last:mb-0">
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-ink-muted italic">No text summary generated for this session.</p>
                  )}
                </div>
              </div>

              {/* Full Interview Dialogue Transcript */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sage-700" />
                  Interview Dialogue Transcript {transcriptList.length > 0 && `(${transcriptList.length} turns)`}
                </h4>
                <div className="max-h-72 overflow-y-auto space-y-3 p-4 rounded-lg bg-surface border border-line">
                  {transcriptList.length > 0 ? (
                    transcriptList.map((turn, i) => (
                      <div
                        key={i}
                        className={`flex flex-col ${
                          turn.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-ink-muted">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              turn.role === "user" ? "bg-sage-600" : "bg-ink-muted"
                            }`}
                          />
                          <span>
                            {turn.role === "user" ? candidate?.fullname || "Candidate" : "AI Interviewer"}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                            turn.role === "user"
                              ? "bg-sage-100 text-ink border border-sage-200"
                              : "bg-surface-alt text-ink border border-line"
                          }`}
                        >
                          {turn.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-ink-muted italic text-center py-4">
                      Detailed dialogue transcript was not recorded for this legacy session.
                    </p>
                  )}
                </div>
              </div>

              {/* Recommendation Block & Actions */}
              <div
                className={`p-4 sm:p-5 rounded-lg border ${
                  recommendationStatus === "recommended"
                    ? "bg-success-soft border-success/30 text-ink"
                    : recommendationStatus === "not_recommended"
                    ? "bg-danger-soft border-danger/30 text-ink"
                    : "bg-warning-soft border-warning/30 text-ink"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {recommendationStatus === "recommended" ? (
                        <CheckCircle className="w-5 h-5 text-success shrink-0" strokeWidth={1.75} />
                      ) : recommendationStatus === "not_recommended" ? (
                        <XCircle className="w-5 h-5 text-danger shrink-0" strokeWidth={1.75} />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-warning shrink-0" strokeWidth={1.75} />
                      )}
                      <h4 className="font-semibold text-base text-ink">
                        {displayRecommendationTitle}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
                      {finalRecommendationMessage}
                    </p>
                  </div>

                  {/* Email action trigger buttons */}
                  <div className="flex flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
                    <Button
                      onClick={() => handleOpenDecisionDialog("selected")}
                      size="sm"
                      className="h-8 text-xs font-medium bg-sage-700 hover:bg-sage-800 text-white justify-start"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      Advance Candidate
                    </Button>
                    <Button
                      onClick={() => handleOpenDecisionDialog("reevaluate")}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium justify-start"
                    >
                      Request Follow-up
                    </Button>
                    <Button
                      onClick={() => handleOpenDecisionDialog("rejected")}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium text-danger border-line hover:bg-danger-soft justify-start"
                    >
                      Send Rejection
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>

    {/* Candidate Decision Email Dispatcher Dialog */}
    <CandidateDecisionEmailDialog
      isOpen={decisionDialog.isOpen}
      onClose={() => setDecisionDialog((prev) => ({ ...prev, isOpen: false }))}
      decisionType={decisionDialog.decisionType}
      candidate={candidate}
      initialSubject={decisionDialog.initialSubject}
      initialMessage={decisionDialog.initialMessage}
    />
  </>
  );
}

export default CandidateFeedbackDialog;
