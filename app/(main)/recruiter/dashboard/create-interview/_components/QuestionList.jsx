"use client";
import { useUser } from "@/app/provider";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Loader2Icon, PlusIcon, Trash2Icon, MessageSquare } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/services/supabaseClient";
import { Input } from "@/components/ui/input";

function QuestionList({ formData, onCreateLink }) {
  const [loading, setLoading] = useState(true);
  const [questionList, setQuestionList] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("behavioral");
  const { user, updateUserCredits } = useUser();
  const hasCalled = useRef(false);

  useEffect(() => {
    if (formData && !hasCalled.current) {
      generateQuestionList();
    }
  }, [formData]);

  const generateQuestionList = async () => {
    setLoading(true);
    hasCalled.current = true;
    try {
      const result = await axios.post("/api/ai-model", {
        ...formData,
      });

      const rawContent = result?.data?.content || result?.data?.Content;
      if (!rawContent) {
        toast.error("Invalid response format from AI service");
        return;
      }

      let jsonString = rawContent;
      const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match && match[1]) {
        jsonString = match[1].trim();
      } else {
        jsonString = jsonString.trim();
      }

      if (jsonString.startsWith("interviewQuestions =") || jsonString.startsWith("interviewQuestions=")) {
        jsonString = jsonString.replace(/^interviewQuestions\s*=\s*/, "").trim();
      }

      let parsedData = JSON.parse(jsonString);
      if (Array.isArray(parsedData)) {
        parsedData = { interviewQuestions: parsedData };
      }
      setQuestionList(parsedData);
    } catch (e) {
      toast.error("Error generating question plan. Please retry.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setQuestionList(prev => {
      const currentList = prev?.interviewQuestions || [];
      return {
        ...prev,
        interviewQuestions: [
          ...currentList,
          { question: newQuestion.trim(), type: newQuestionType }
        ]
      };
    });

    setNewQuestion("");
    toast.success("Question added to session plan");
  };

  const handleDeleteQuestion = (index) => {
    setQuestionList(prev => {
      if (!prev?.interviewQuestions) return prev;
      const updated = [...prev.interviewQuestions];
      updated.splice(index, 1);
      return {
        ...prev,
        interviewQuestions: updated
      };
    });
    toast.success("Question removed");
  };

  const onFinish = async () => {
    setSaveLoading(true);
    const interview_id = uuidv4();

    try {
      const currentCredits = user?.credits || 0;
      if (currentCredits <= 0) {
        toast.error("Insufficient interview credits available");
        setSaveLoading(false);
        return;
      }

      const newCredits = currentCredits - 1;
      const creditUpdateResult = await updateUserCredits(newCredits);
      
      if (!creditUpdateResult.success) {
        toast.error("Failed to deduct interview credit.");
        setSaveLoading(false);
        return;
      }

      const { error } = await supabase
        .from("Interviews")
        .insert([
          {
            ...formData,
            questionList: questionList,
            userEmail: user?.email,
            interview_id: interview_id,
          },
        ]);

      if (error) {
        console.error("Supabase insert error:", error?.message, error?.code, error?.details, error?.hint);
        await updateUserCredits(currentCredits);
        toast.error("Failed to save interview configuration");
      } else {
        toast.success("Interview created successfully!");
        onCreateLink(interview_id);
      }
    } catch (e) {
      console.error("Error saving interview:", e);
      toast.error("Error finalizing interview setup");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {loading && (
        <div className="bg-surface rounded-lg border border-line p-10 flex flex-col items-center justify-center text-center shadow-card">
          <Loader2Icon className="animate-spin w-8 h-8 text-sage-700 mb-3" />
          <h3 className="font-semibold text-ink text-base">Synthesizing Question Set</h3>
          <p className="text-xs text-ink-muted mt-1 max-w-sm">
            Evaluating job parameters and generating structured interview questions matched to duration.
          </p>
        </div>
      )}

      {!loading && questionList?.interviewQuestions && (
        <div className="space-y-5">
          {/* Add custom question */}
          <div className="bg-surface rounded-lg border border-line p-4 sm:p-5 shadow-card">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2.5">
              Add Custom Question
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter custom interview question..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
              />
              <select
                value={newQuestionType}
                onChange={(e) => setNewQuestionType(e.target.value)}
                className="h-10 px-3 rounded-md border border-line bg-surface text-xs text-ink outline-none"
              >
                <option value="behavioral">Behavioral</option>
                <option value="technical">Technical</option>
                <option value="situational">Problem Solving</option>
                <option value="experience">Experience</option>
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddQuestion}
                className="text-xs shrink-0"
              >
                <PlusIcon className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Generated Questions List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Session Questions ({questionList.interviewQuestions.length})
            </h4>
            {questionList.interviewQuestions.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-surface rounded-lg border border-line shadow-card flex items-start justify-between gap-3 text-sm"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="font-mono text-xs font-semibold text-sage-800 bg-sage-100 border border-sage-200 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                    Q{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink leading-relaxed">
                      {item.question}
                    </p>
                    <span className="inline-block mt-1 text-xs text-ink-muted">
                      Type: <span className="text-sage-700 font-medium">{item.type}</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(index)}
                  className="text-ink-muted hover:text-danger hover:bg-danger-soft p-1.5 rounded transition-colors cursor-pointer"
                  title="Remove question"
                >
                  <Trash2Icon className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>

          {/* Sticky footer action */}
          <div className="pt-4 border-t border-line flex justify-end">
            <Button
              onClick={onFinish}
              disabled={saveLoading || (user?.credits || 0) <= 0}
              className="bg-sage-700 hover:bg-sage-800 text-white font-medium"
            >
              {saveLoading ? (
                <>
                  <Loader2Icon className="animate-spin w-4 h-4 mr-2" />
                  Finalizing Role...
                </>
              ) : (
                "Save & Generate Interview Link"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionList;
