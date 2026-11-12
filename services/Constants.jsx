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

export const FEEDBACK_PROMPT = `You are an expert technical hiring manager evaluating an interview conversation.
Analyze this interview conversation between the AI Interviewer (assistant) and the Candidate (user):
{{conversation}}

CRITICAL EVALUATION & RATING CALIBRATION RULES (MANDATORY CONSISTENCY):
1. IF THE CANDIDATE GAVE MINIMAL, BLANK, OR ONLY GREETING RESPONSES (< 2 substantial answers):
   - All competency ratings MUST be between 0 and 3 out of 10.
   - "Recommendation" MUST be "Not Recommended".
   - "RecommendationMessage" MUST state: "Candidate provided minimal or insufficient responses to evaluate competencies."
   - "summary" MUST state in 3-4 sentences that the interaction lacked substantive technical depth.

2. IF THE CANDIDATE DEMONSTRATED STRONG COMPETENCE & ANSWERED QUESTIONS WELL:
   - Competency ratings MUST be between 7 and 10 out of 10.
   - "Recommendation" MUST be "Recommended".
   - "RecommendationMessage" MUST highlight their demonstrated technical strengths and suitability.
   - "summary" MUST detail in 3-4 sentences their technical competence, architecture knowledge, and communication.

3. IF THE CANDIDATE HAD MIXED OR BORDERLINE PERFORMANCE:
   - Competency ratings MUST be between 4 and 6 out of 10.
   - "Recommendation" MUST be "Follow-up Required".
   - "RecommendationMessage" MUST state specific areas needing further assessment.
   - "summary" MUST summarize demonstrated strengths vs areas requiring follow-up.

MATHEMATICAL CONSISTENCY RULE:
The numerical scores and hiring verdict MUST be 100% aligned:
- Average score >= 7.0 => Recommendation MUST be "Recommended"
- Average score <= 4.0 => Recommendation MUST be "Not Recommended"
- Average score 4.1 to 6.9 => Recommendation MUST be "Follow-up Required"

Respond strictly with a valid JSON object matching this schema (replace placeholders with actual evaluated values):
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
    "summary": "3 to 4 sentences analyzing candidate responses, technical depth, and overall performance.",
    "summery": "Same 3 to 4 sentences for backward compatibility.",
    "Recommendation": "Recommended | Not Recommended | Follow-up Required",
    "RecommendationMessage": "One concise line summarizing hiring verdict."
  }
}
`;