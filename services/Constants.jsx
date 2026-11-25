import { BriefcaseBusinessIcon, Code2Icon, User2Icon, Component, Puzzle, Calendar, LayoutDashboard, List, Settings, WalletCards, LogOutIcon, Video } from "lucide-react";

export const SideBarOptions=[
    {
        name:'Dashboard',
        icon:LayoutDashboard,
        path:'/recruiter/dashboard'
    },
    {
        name:'Scheduled Interview',
        icon:Calendar,
        path:'/recruiter/scheduled-interview'
    },
    {
        name:'All Interview',
        icon:List,
        path:'/recruiter/all-interview'
    },
    {
        name:'Profile',
        icon:User2Icon,
        path:'/recruiter/profile'
    },
    {
        name:'Billing',
        icon:WalletCards,
        path:'/recruiter/billing'
    },
   
   
]

export const SideBarCondidate=[
    {
        name:'Dashboard',
        icon:LayoutDashboard,
        path:'/candidate/dashboard'
    },
    {
        name:'Interviews',
        icon:Video,
        path:'/candidate/interviews'
    },
    {
        name:'Profile',
        icon:User2Icon,
        path:'/candidate/profile'
    },
   
   
]

export const InterviewType=[
    {
        name:'Technical',
        icon:Code2Icon,
    },
    {
        name:'Behavioral',
        icon:User2Icon,
    },
    {
        name:'Experience',
        icon:BriefcaseBusinessIcon,
    },
    {
        name:'Problem Solving',
        icon:Puzzle,
    },
    {
        name:'Leadership',
        icon:Component,
    },
]

export const QUESTIONS_PROMPT=`You are an expert technical interviewer.
Based on the following inputs, generate a well-structured list of high-quality interview questions including candidate introduction, salary negotiation, and closing questions.

Job Title: {{jobPosition}}

Job Description:{{jobDescription}}

Interview Duration: {{duration}}

Interview Type: {{type}}

📝 Your task:

Analyze the job description to identify key responsibilities, required skills, and expected experience.

Generate a list of interview questions depends on interview duration

Adjust the number and depth of questions to match the interview duration or more.

Ensure the questions match the tone and structure of a real-life {{type}} interview.

🧩 Format your response in JSON format with array list of questions.
format: interviewQuestions=[
{
 question:'',
 type:'Candidate selfIntroduction about education background, work experience/Candidate home and working locations/worked previous and current working company/Why Should we hire you/Present salary negotiation/Technical/Behavioral/Experience/Problem Solving/Leadership'
},{
...
}]

🎯 The goal is to create a structured, relevant, and time-optimized interview plan for a {{jobPosition}} role.`

export const FEEDBACK_PROMPT = `You are a senior technical hiring manager performing a rigorous, evidence-based evaluation of a voice interview.

Interview transcript between AI Interviewer (role: "assistant") and the Candidate (role: "user"):
{{conversation}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — READ THE TRANSCRIPT CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Count the candidate's substantive responses (entries where role === "user" with more than a greeting or filler).
Assess the CONTENT of each answer: technical depth, accuracy, examples given, communication clarity, and relevance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — DETERMINE PERFORMANCE TIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based solely on the actual quality of the candidate's answers:

TIER A — STRONG CANDIDATE (most answers are correct, detailed, and technically sound):
- TechnicalSkills: 7–10 | Communication: 7–10 | ProblemSolving: 7–10 | Experience: 7–10 | Behavioral: 7–10 | Analysis: 7–10
- Recommendation: "Recommended"

TIER B — MIXED / BORDERLINE (some good answers, some weak or incomplete):
- Ratings vary per competency between 4–7 reflecting actual gaps
- Recommendation: "Follow-up Required"

TIER C — WEAK / MINIMAL ENGAGEMENT (candidate mostly silent, gave only 1-2 short replies, or showed no technical knowledge):
- All ratings: 0–3
- Recommendation: "Not Recommended"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — SCORE EACH COMPETENCY INDEPENDENTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rate each dimension 0–10 based on EVIDENCE in the transcript, not on assumptions:
- TechnicalSkills: Accuracy and depth of technical answers.
- Communication: Clarity, structure, and conciseness of responses.
- ProblemSolving: Logical reasoning, handling of complex questions, edge-case awareness.
- Experience: Concrete examples, real-world project experience mentioned.
- Behavioral: Professionalism, composure, follow-through under pressure.
- Analysis: Ability to dissect problems, compare trade-offs, reason from first principles.

A candidate who gives thorough, correct, well-structured answers MUST receive 7–10 in relevant dimensions.
Do NOT apply a blanket low score simply because the interview was short — score what was actually said.

MATHEMATICAL CONSISTENCY (REQUIRED):
- Average score >= 7.0 → Recommendation MUST be "Recommended"
- Average score 4.1–6.9 → Recommendation MUST be "Follow-up Required"
- Average score <= 4.0 → Recommendation MUST be "Not Recommended"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — Respond ONLY with this JSON (no extra text):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "feedback": {
    "rating": {
      "TechnicalSkills": 0,
      "Communication": 0,
      "ProblemSolving": 0,
      "Experience": 0,
      "Behavioral": 0,
      "Analysis": 0
    },
    "summary": "3–4 sentences: what the candidate demonstrated, specific strengths or gaps, and overall impression.",
    "summery": "Same 3–4 sentences (backward compatibility field).",
    "Recommendation": "Recommended | Not Recommended | Follow-up Required",
    "RecommendationMessage": "One concise hiring verdict sentence citing the strongest evidence from the transcript."
  }
}
`;