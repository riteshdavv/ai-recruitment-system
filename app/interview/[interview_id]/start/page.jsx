"use client";

import { InterviewDataContext } from "@/context/InterviewDataContext";
import { Mic, Phone, Timer, Volume2, ShieldCheck, HelpCircle } from "lucide-react";
import React, { useContext, useEffect, useState, useRef } from "react";
import AlertConfirmation from "./_components/AlertConfirmation";
import axios from "axios";
import TimmerComponent from "./_components/TimmerComponent";
import { getVapiClient } from "@/lib/vapiconfig";
import { supabase } from "@/services/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
  const vapi = getVapiClient();
  const [activeUser, setActiveUser] = useState(false);
  const [start, setStart] = useState(false);
  const [subtitles, setSubtitles] = useState("");
  const [lastTurns, setLastTurns] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const conversation = useRef(null);
  const { interview_id } = useParams();
  const router = useRouter();
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  useEffect(() => {
    if (!interviewInfo && typeof window !== 'undefined') {
      const stored = localStorage.getItem('interviewInfo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.interview_id === interview_id) {
            setInterviewInfo(parsed);
          } else {
            localStorage.removeItem('interviewInfo');
            router.replace(`/interview/${interview_id}`);
          }
        } catch {
          localStorage.removeItem('interviewInfo');
          router.replace(`/interview/${interview_id}`);
        }
      } else {
        router.replace(`/interview/${interview_id}`);
      }
    }
  }, [interviewInfo, interview_id, setInterviewInfo, router]);

  useEffect(() => {
    if (
      interviewInfo &&
      interviewInfo?.jobPosition &&
      vapi &&
      !start
    ) {
      setStart(true);
      startCall();
    }
  }, [interviewInfo, vapi]);

  const startCall = async () => {
    const jobPosition = interviewInfo?.jobPosition || "Role Position";
    const questionList = interviewInfo?.questionList?.interviewQuestions?.map((question) => question?.question) || [];

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hello ${interviewInfo?.candidate_name || "there"}. Welcome to your interview session for the ${jobPosition} position. When you are ready, let's begin with our questions.`,
      transcriber: {
        provider: "deepgram",
        model: "nova-3",
        language: "en-US",
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
You are an executive AI voice interviewer conducting a professional screening.
Your job is to ask the candidate the provided interview questions one by one and assess their answers.
Ask one question at a time and wait patiently for the candidate's response.
Questions: ${JSON.stringify(questionList)}
Be conversational, professional, concise, and friendly.
After finishing the questions, conclude smoothly and let them know their responses have been recorded.
`.trim(),
          },
        ],
      },
    };

    vapi.start(assistantOptions);
  };

  useEffect(() => {
    if (!vapi) return;

    const handleMessage = (message) => {
      if (message?.role === "assistant" && message?.content) {
        setSubtitles(message.content);
        setLastTurns(prev => [...prev.slice(-2), message.content]);
      }
      
      if (message && message?.conversation) {
        const filteredConversation = message.conversation.filter((msg) => msg.role !== "system") || "";
        conversation.current = JSON.stringify(filteredConversation, null, 2);
      }
    };

    const handleSpeechStart = () => {
      setIsSpeaking(true);
      setActiveUser(false);
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      setActiveUser(true);
    };

    vapi.on("message", handleMessage);
    vapi.on("call-start", () => {
      toast.success('Session started');
      setStart(true);
    });
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-end", () => {
      toast.info('Interview call concluded. Generating evaluation...');
      setIsGeneratingFeedback(true);
      GenerateFeedback();
    });

    return () => {
      vapi.off("message", handleMessage);
      vapi.off("call-start", () => {});
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-end", () => {});
    };
  }, [vapi]);

  const GenerateFeedback = async () => {
    if (!interviewInfo || !conversation.current) {
      toast.error("Interview conversation missing. Redirecting to start.");
      router.replace(`/interview/${interview_id}`);
      return;
    }
    try {
      const result = await axios.post("/api/ai-feedback", {
        conversation: conversation.current,
      });

      const Content = result?.data?.content
        ?.replace("```json", "")
        ?.replace("```", "")
        ?.trim();

      if (!Content) throw new Error("Feedback response empty");

      let parsedTranscript;
      try {
        parsedTranscript = JSON.parse(Content);
      } catch (e) {
        console.error("Invalid JSON:", Content);
        throw new Error("Could not parse AI evaluation JSON");
      }

      const { error: insertError } = await supabase
        .from("interview_results")
        .insert([
          {
            fullname: interviewInfo?.candidate_name,
            email: interviewInfo?.userEmail,
            interview_id: interview_id,
            conversation_transcript: parsedTranscript,
            recommendations: parsedTranscript?.feedback?.Recommendation || "Completed",
            completed_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error("Insert failed");
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('interviewInfo');
      }
      toast.success("Feedback generated successfully!");
      router.replace("/interview/" + interviewInfo?.interview_id + "/completed");
    } catch (error) {
      console.error("Feedback generation failed:", error);
      toast.error("Failed to generate complete feedback");
      router.replace("/interview/" + interviewInfo?.interview_id + "/completed");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };
  
  const stopInterview = () => {
    if (vapi) vapi.stop();
  };

  // State determination as per Section 6.1
  const agentState = isSpeaking ? "speaking" : activeUser ? "listening" : start ? "processing" : "connecting";

  return (
    <div className="min-h-screen bg-sage-50 py-10 px-4 sm:px-6 flex flex-col justify-between">
      {/* 720px focused column as per Section 6.1 */}
      <div className="max-w-[720px] mx-auto w-full space-y-6">
        {/* Top Header bar with mono timer */}
        <header className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sage-700">Live Voice Evaluation</span>
            <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-snug">
              {interviewInfo?.jobPosition || "Candidate Interview"}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-surface px-3.5 py-1.5 rounded-full border border-line shadow-xs font-mono text-sm font-medium text-ink tabular-nums">
            <Timer className="w-4 h-4 text-sage-700" strokeWidth={1.75} />
            <TimmerComponent start={start} />
          </div>
        </header>

        {/* AI Agent Panel with Orb / Waveform States as per Section 6.1 */}
        <div className="bg-surface rounded-xl border border-line shadow-card p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          {/* Subtle background ambient pulse for speaking */}
          {agentState === "speaking" && (
            <div className="absolute inset-0 bg-sage-100/40 animate-pulse pointer-events-none" />
          )}

          <div className="relative z-10 flex flex-col items-center">
            {/* Circular orb with 4 states */}
            <div className="relative flex items-center justify-center my-4">
              {agentState === "speaking" && (
                <div className="absolute -inset-4 rounded-full bg-sage-200/60 animate-ping opacity-60" />
              )}
              {agentState === "listening" && (
                <div className="absolute -inset-2 rounded-full border-2 border-sage-700 animate-pulse" />
              )}

              <div
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                  agentState === "speaking"
                    ? "bg-sage-100 border-4 border-sage-600 shadow-pop scale-105"
                    : agentState === "listening"
                    ? "bg-surface border-4 border-sage-700 ring-4 ring-sage-100"
                    : agentState === "processing"
                    ? "bg-sage-50 border-4 border-sage-400"
                    : "bg-surface-alt border-4 border-sage-300"
                }`}
              >
                {/* State-specific visual */}
                {agentState === "speaking" ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-6 bg-sage-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-10 bg-sage-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-7 bg-sage-700 rounded-full animate-bounce [animation-delay:-0.45s]" />
                    <span className="w-1.5 h-11 bg-sage-700 rounded-full animate-bounce" />
                    <span className="w-1.5 h-5 bg-sage-700 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  </div>
                ) : agentState === "listening" ? (
                  <div className="flex flex-col items-center gap-1">
                    <Mic className="w-8 h-8 text-sage-800 animate-pulse" strokeWidth={2} />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sage-800 font-semibold">Listening</span>
                  </div>
                ) : agentState === "processing" ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse delay-100" />
                    <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse delay-200" />
                  </div>
                ) : (
                  <Volume2 className="w-7 h-7 text-sage-500" strokeWidth={1.75} />
                )}
              </div>
            </div>

            {/* Status indicator chip */}
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
                  agentState === "speaking"
                    ? "bg-sage-100 text-sage-800 border border-sage-200"
                    : agentState === "listening"
                    ? "bg-success-soft text-success border border-success/20"
                    : "bg-surface-alt text-ink-muted border border-line"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  agentState === "speaking" ? "bg-sage-600 animate-pulse" : agentState === "listening" ? "bg-success animate-pulse" : "bg-ink-subtle"
                }`} />
                {agentState === "speaking" ? "AI Agent is speaking..." : agentState === "listening" ? "Listening to your response" : "Synthesizing next prompt"}
              </span>
            </div>

            {/* Candidate identity note */}
            <p className="text-xs text-ink-muted mt-2 font-mono">
              Candidate: <span className="text-ink font-medium">{interviewInfo?.candidate_name || "Interviewee"}</span>
            </p>
          </div>

          {/* Live Caption Area under orb as per Section 6.1 */}
          <div className="pt-4 border-t border-line text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">Live Transcript</span>
            <div className="p-4 rounded-md bg-surface-alt border border-line min-h-[90px] flex items-center justify-center">
              {subtitles ? (
                <p className="text-[15px] text-ink leading-relaxed font-normal text-center">
                  "{subtitles}"
                </p>
              ) : (
                <p className="text-sm text-ink-subtle text-center italic">
                  {agentState === "speaking" ? "Receiving audio stream..." : "Waiting for audio prompt..."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Controls Bar as per Section 6.1 (fixed bottom on mobile or inline) */}
        <div className="bg-surface rounded-lg border border-line p-4 shadow-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="hidden sm:inline">Encrypted audio pipeline connected</span>
            <span className="sm:hidden">Call active</span>
          </div>

          <div className="flex items-center gap-3">
            <AlertConfirmation stopInterview={stopInterview}>
              <Button
                variant="outline"
                className="h-10 text-xs font-medium text-danger border-line hover:bg-danger-soft hover:text-danger hover:border-danger/20 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" strokeWidth={1.75} />
                <span>End Interview</span>
              </Button>
            </AlertConfirmation>
          </div>
        </div>
      </div>

      {/* Generating Feedback Modal Overlay */}
      {isGeneratingFeedback && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-line p-8 max-w-sm w-full text-center shadow-pop space-y-4">
            <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto text-sage-700">
              <div className="w-6 h-6 border-2 border-sage-700 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">Analyzing Interview</h2>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Evaluating answers, calculating competency ratings, and compiling your assessment synthesis...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StartInterview;
