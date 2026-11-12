"use client";

import { InterviewDataContext } from "@/context/InterviewDataContext";
import { Mic, Phone, Timer, Volume2, ShieldCheck, HelpCircle } from "lucide-react";
import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const conversation = useRef([]);
  const { interview_id } = useParams();
  const router = useRouter();
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // Browser-native speech recognition & synthesis refs
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const turnCountRef = useRef(1);
  const isBrowserMode = !vapi;

  // Restore stored session if page refreshed
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

  // ==========================================
  // 1. VAPI WebRTC VOICE MODE (If Vapi Key Present)
  // ==========================================
  const startVapiCall = useCallback(() => {
    if (!vapi || !interviewInfo) return;

    const jobPosition = interviewInfo?.jobPosition || "Technical Specialist";
    const jobDescription = interviewInfo?.jobDescription || "";
    const questionList = interviewInfo?.questionList?.interviewQuestions?.map((q) => q?.question) || [];
    const candidateName = interviewInfo?.candidate_name || "there";

    const adaptiveSystemPrompt = `
You are an expert Executive AI Technical Interviewer conducting a live, adaptive voice screening for the position of "${jobPosition}".
Candidate Name: ${candidateName}
${jobDescription ? `Job Context & Requirements: ${jobDescription}` : ""}

YOUR CORE DIRECTIVE - ADAPTIVE DYNAMIC INTERVIEWING:
Do NOT follow a static, rigid script. You must evaluate the candidate's responses in real-time and dynamically adjust the difficulty, depth, and direction:
1. STARTER QUESTIONS (Baseline):
   Start with a baseline competency question selected from: ${JSON.stringify(questionList.slice(0, 3))}
2. REAL-TIME ADAPTATION & BRANCHING:
   - IF THE CANDIDATE GIVES A STRONG / QUALIFIED ANSWER:
     -> Briefly acknowledge the technical point.
     -> Elevate the challenge. Ask an advanced follow-up exploring architecture trade-offs, edge cases, failure recovery, or concurrency.
   - IF THE CANDIDATE GIVES A VAGUE OR BUZZWORD-HEAVY ANSWER:
     -> Ask for a concrete practical implementation example from their real work experience.
   - IF THE CANDIDATE STRUGGLES:
     -> Pivot warmly to another core competency area so they can demonstrate their strengths.
3. CONVERSATIONAL VOICE CONSTRAINTS:
   - Ask exactly ONE question at a time.
   - Keep your responses under 2-3 sentences so the candidate has plenty of airtime.
   - Speak naturally, professionally, and warmly.
   - Cover ~4 to 5 key competency domains across the interview, then conclude warmly and thank ${candidateName}.
`.trim();

    const assistantOptions = {
      name: "RecruitAI Interviewer",
      firstMessage: `Hello ${candidateName}. Welcome to your interview session for the ${jobPosition} position. I'm excited to speak with you today. When you're ready, let's get started.`,
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
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        fallbackModels: [
          {
            provider: "openai",
            model: "gpt-4o-mini",
          },
        ],
        messages: [
          {
            role: "system",
            content: adaptiveSystemPrompt,
          },
        ],
      },
    };

    vapi.start(assistantOptions);
  }, [vapi, interviewInfo]);

  // Vapi event subscriptions
  useEffect(() => {
    if (!vapi) return;

    const handleMessage = (message) => {
      if (message?.role === "assistant" && message?.content) {
        setSubtitles(message.content);
      }

      if (message && message?.conversation) {
        const filtered = message.conversation.filter((msg) => msg.role !== "system");
        conversation.current = filtered;
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

  // ==========================================
  // 2. BROWSER-NATIVE ADAPTIVE VOICE MODE (When Vapi Key Absent)
  // ==========================================
  const speakText = useCallback((text, onEnd) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best English voice available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Karen"))
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveUser(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveUser(true);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveUser(true);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleCandidateResponse = useCallback(async (candidateTranscript) => {
    if (!candidateTranscript || !candidateTranscript.trim()) return;

    // Add candidate turn
    const userTurn = { role: "user", content: candidateTranscript.trim() };
    conversation.current = [...conversation.current, userTurn];

    setIsSpeaking(false);
    setActiveUser(false); // Processing state
    setSubtitles("Synthesizing adaptive follow-up question...");

    try {
      const questionList = interviewInfo?.questionList?.interviewQuestions?.map((q) => q?.question) || [];
      const res = await axios.post("/api/ai-interview-turn", {
        jobPosition: interviewInfo?.jobPosition || "Technical Role",
        jobDescription: interviewInfo?.jobDescription || "",
        candidateName: interviewInfo?.candidate_name || "Candidate",
        conversationHistory: conversation.current,
        questionList,
        turnCount: turnCountRef.current,
      });

      const nextTurn = res.data;
      turnCountRef.current = nextTurn.turnCount || turnCountRef.current + 1;

      const aiText = nextTurn.message || "Thank you. Let's move to the next question.";
      const assistantTurn = { role: "assistant", content: aiText };
      conversation.current = [...conversation.current, assistantTurn];
      setSubtitles(aiText);

      // Speak AI response out loud
      speakText(aiText, () => {
        if (nextTurn.isConcluded) {
          toast.info("Interview concluded. Generating evaluation...");
          setIsGeneratingFeedback(true);
          GenerateFeedback();
        } else {
          // Listen for next candidate turn
          startListening();
        }
      });
    } catch (err) {
      console.error("Adaptive turn error:", err);
      toast.error("Failed to generate follow-up question.");
    }
  }, [interviewInfo, speakText]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        isListeningRef.current = true;
        setActiveUser(true);
        setIsSpeaking(false);
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text) {
          handleCandidateResponse(text);
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition notice:", e.error);
        if (e.error === "no-speech") {
          // Restart listening if candidate was just thinking
          if (!isSpeaking && start) {
            setTimeout(() => {
              try { recognition.start(); } catch {}
            }, 600);
          }
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Recognition start error:", err);
    }
  }, [handleCandidateResponse, isSpeaking, start]);

  // Start Browser-Native Call
  const startBrowserCall = useCallback(() => {
    const jobPosition = interviewInfo?.jobPosition || "Technical Role";
    const candidateName = interviewInfo?.candidate_name || "there";
    const firstQ = interviewInfo?.questionList?.interviewQuestions?.[0]?.question || "Can you tell me about your background and recent projects?";

    const introText = `Hello ${candidateName}. Welcome to your live adaptive interview for the ${jobPosition} position. Let's begin: ${firstQ}`;
    
    setStart(true);
    setSubtitles(introText);
    conversation.current = [{ role: "assistant", content: introText }];

    // Speak introduction, then listen for candidate's answer
    speakText(introText, () => {
      startListening();
    });
  }, [interviewInfo, speakText, startListening]);

  // Initialize Session
  useEffect(() => {
    if (interviewInfo && interviewInfo?.jobPosition && !start) {
      if (vapi) {
        setStart(true);
        startVapiCall();
      } else {
        // Start browser-native engine with dynamic adaptive branching
        startBrowserCall();
      }
    }
  }, [interviewInfo, vapi, start, startVapiCall, startBrowserCall]);

  // Generate Final Feedback
  const GenerateFeedback = async () => {
    if (!interviewInfo || conversation.current.length === 0) {
      toast.error("Interview conversation missing. Redirecting.");
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
    if (vapi) {
      vapi.stop();
    } else {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        if (recognitionRef.current) recognitionRef.current.abort();
      }
      setIsGeneratingFeedback(true);
      GenerateFeedback();
    }
  };

  // State determination
  const agentState = isSpeaking ? "speaking" : activeUser ? "listening" : start ? "processing" : "connecting";

  return (
    <div className="min-h-screen bg-sage-50 py-10 px-4 sm:px-6 flex flex-col justify-between">
      {/* 720px focused column */}
      <div className="max-w-[720px] mx-auto w-full space-y-6">
        {/* Top Header bar with mono timer */}
        <header className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sage-700">Live Voice Evaluation</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200">
                Adaptive AI Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-snug">
              {interviewInfo?.jobPosition || "Candidate Interview"}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-surface px-3.5 py-1.5 rounded-full border border-line shadow-xs font-mono text-sm font-medium text-ink tabular-nums">
            <Timer className="w-4 h-4 text-sage-700" strokeWidth={1.75} />
            <TimmerComponent start={start} />
          </div>
        </header>

        {/* AI Agent Panel with Orb / Waveform States */}
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
                {agentState === "speaking" ? "AI Interviewer is speaking..." : agentState === "listening" ? "Listening to your answer..." : "Evaluating answer & adapting next question..."}
              </span>
            </div>

            {/* Candidate identity note */}
            <p className="text-xs text-ink-muted mt-2 font-mono">
              Candidate: <span className="text-ink font-medium">{interviewInfo?.candidate_name || "Interviewee"}</span>
            </p>
          </div>

          {/* Live Caption Area under orb */}
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

        {/* Controls Bar */}
        <div className="bg-surface rounded-lg border border-line p-4 shadow-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="hidden sm:inline">Encrypted audio session active</span>
            <span className="sm:hidden">Interview active</span>
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
