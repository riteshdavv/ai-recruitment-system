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
import { Download, Star, CheckCircle, AlertTriangle, FileText, Mail, XCircle, MessageSquare, Sparkles, Target, AlertCircle, Check, RefreshCw, Loader2 } from "lucide-react";
import Image from "next/image";
import CandidateDecisionEmailDialog from "./CandidateDecisionEmailDialog";

function CandidateFeedbackDialog({ candidate, interviewDetail }) {
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [cvAvailable, setCvAvailable] = useState(false);
  const [cvFilePath, setCvFilePath] = useState(null);
  const [candidatePicture, setCandidatePicture] = useState(null);

  // ATS state
  const [activeTab, setActiveTab] = useState("interview"); // "interview" | "ats"
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [atsTargetRole, setAtsTargetRole] = useState(null);
  const [atsScoringLoading, setAtsScoringLoading] = useState(false);

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
        .select('cv_file_path, picture, cv_parsed_data, cv_score, cv_target_role')
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

      // Load candidate's existing ATS results (if they already scored their CV)
      if (userData?.cv_parsed_data) {
        setAtsAnalysis(userData.cv_parsed_data);
        setAtsScore(userData.cv_score);
        setAtsTargetRole(userData.cv_target_role);
      }
    } catch (error) {
      console.error('Error fetching candidate CV:', error);
    }
  };

  // Score the candidate's CV against the job's position/description
  const handleScoreCv = async () => {
    if (!cvFilePath) {
      toast.error("No resume on file for this candidate.");
      return;
    }
    setAtsScoringLoading(true);
    try {
      const jobRole = candidate?.jobPosition || "Technical Specialist";
      const jobDescription = candidate?.jobDescription || "";

      const res = await fetch("/api/candidate/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvFilePath, jobRole, jobDescription }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to score resume.");

      setAtsAnalysis(data.analysis);
      setAtsScore(data.analysis?.score || 0);
      setAtsTargetRole(jobRole);
      toast.success(`Resume scored: ${data.analysis?.score ?? 0}/100 match for ${jobRole}`);
    } catch (err) {
      toast.error(err.message || "Failed to score resume.");
    } finally {
      setAtsScoringLoading(false);
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

  // Resolve jobPosition from joined interviewDetail (recruiter side always has this) or fallback
  const jobPosition = interviewDetail?.jobPosition || candidate?.jobPosition || "the position";

  const emailTemplates = {
    selected: `Subject: Invitation to Next Interview Stage: ${jobPosition}

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

    rejected: `Subject: Update Regarding Your Application for ${jobPosition}

Dear ${candidate?.fullname || "Candidate"},

Thank you for completing your interview assessment for the ${jobPosition} role.

While your profile has merits, we have decided to advance other candidates whose current skill alignment more closely fits this position's immediate needs.

We appreciate the time you dedicated to interviewing with us and wish you continued success.

Sincerely,
Hiring Team`,

    reevaluate: `Subject: Follow-up on Your Interview Assessment for ${jobPosition}

Dear ${candidate?.fullname || "Candidate"},

Thank you for completing the initial voice interview for the ${jobPosition} role. We would like to schedule a brief follow-up discussion to explore a few aspects of your experience in greater detail.

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

              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-surface-alt border border-line rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("interview")}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                    activeTab === "interview"
                      ? "bg-sage-700 text-white shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Interview Evaluation
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ats")}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                    activeTab === "ats"
                      ? "bg-sage-700 text-white shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Resume ATS Score
                </button>
              </div>

              {/* ── INTERVIEW EVALUATION TAB ── */}
              {activeTab === "interview" && (
                <div className="space-y-6">
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
              )}

              {/* ── RESUME ATS SCORE TAB ── */}
              {activeTab === "ats" && (
                <div className="space-y-5">
                  {/* Score against this role CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-surface-alt border border-line">
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        Score against: <span className="text-sage-800">{candidate?.jobPosition || "This role"}</span>
                      </p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {atsAnalysis
                          ? "Previously scored — click Rescore to refresh against this role's JD."
                          : cvAvailable
                          ? "Resume on file. Click to run ATS evaluation against this job."
                          : "No resume uploaded by this candidate yet."}
                      </p>
                    </div>
                    <Button
                      onClick={handleScoreCv}
                      disabled={atsScoringLoading || !cvAvailable}
                      size="sm"
                      className="h-9 text-xs font-medium bg-sage-700 hover:bg-sage-800 text-white shrink-0 flex items-center gap-1.5"
                    >
                      {atsScoringLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scoring...</>
                      ) : (
                        <><RefreshCw className="w-3.5 h-3.5" /> {atsAnalysis ? "Rescore" : "Score Resume"}</>
                      )}
                    </Button>
                  </div>

                  {/* Loading state */}
                  {atsScoringLoading && (
                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center text-sage-700">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="absolute -inset-1 rounded-full border border-sage-400 animate-ping opacity-25" />
                      </div>
                      <p className="text-xs text-ink-muted">Analyzing resume against job requirements...</p>
                    </div>
                  )}

                  {/* No resume state */}
                  {!cvAvailable && !atsScoringLoading && (
                    <div className="py-10 text-center">
                      <FileText className="w-8 h-8 text-ink-subtle mx-auto mb-3" />
                      <p className="text-sm font-medium text-ink">No resume on file</p>
                      <p className="text-xs text-ink-muted mt-1">This candidate hasn't uploaded a CV yet.</p>
                    </div>
                  )}

                  {/* ATS Results */}
                  {atsAnalysis && !atsScoringLoading && (
                    <div className="space-y-4">
                      {/* Score hero */}
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-sage-50 to-surface border border-line">
                        <div className="space-y-1">
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-sage-800 block">
                            ATS Match Analysis
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            (atsScore || 0) >= 80 ? "text-success border-success/30 bg-success-soft" :
                            (atsScore || 0) >= 60 ? "text-sage-700 border-sage-300 bg-sage-50" :
                            (atsScore || 0) >= 40 ? "text-amber-700 border-amber-300 bg-amber-50" :
                            "text-danger border-danger/30 bg-danger-soft"
                          }`}>
                            {atsAnalysis.scoreBand || "Evaluated"}
                          </span>
                          <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
                            {atsAnalysis.matchHeadline || atsAnalysis.summary}
                          </p>
                        </div>
                        <div className="text-center bg-surface p-3 rounded-xl border border-line shadow-sm shrink-0">
                          <div className="text-3xl font-extrabold text-ink font-mono">
                            {atsScore ?? 0}<span className="text-sm font-normal text-ink-muted">/100</span>
                          </div>
                          <div className="text-[10px] uppercase font-semibold text-ink-muted tracking-wider">Role Match</div>
                        </div>
                      </div>

                      {/* Top Skills */}
                      {atsAnalysis.topSkills?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Extracted Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {atsAnalysis.topSkills.map((skill, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-sage-100 text-sage-800 font-medium border border-sage-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths & Gaps */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 rounded-lg bg-surface border border-line space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Role Strengths
                          </h4>
                          <ul className="space-y-1.5">
                            {atsAnalysis.matchingStrengths?.length > 0 ? (
                              atsAnalysis.matchingStrengths.map((s, i) => (
                                <li key={i} className="text-xs text-ink flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />{s}
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-ink-muted">No strengths highlighted.</li>
                            )}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-surface border border-line space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> Skill Gaps
                          </h4>
                          <ul className="space-y-1.5">
                            {atsAnalysis.skillGaps?.length > 0 ? (
                              atsAnalysis.skillGaps.map((g, i) => (
                                <li key={i} className="text-xs text-ink flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />{g}
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-ink-muted">No major gaps identified.</li>
                            )}
                          </ul>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}
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
      jobPosition={jobPosition}
      interviewId={interviewDetail?.interview_id || candidate?.interview_id}
      initialSubject={decisionDialog.initialSubject}
      initialMessage={decisionDialog.initialMessage}
    />
  </>
  );
}

export default CandidateFeedbackDialog;
