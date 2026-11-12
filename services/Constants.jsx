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

CRITICAL EVALUATION & RATING CALIBRATION RULES:
1. If the candidate answers minimally, gives only greetings, or answers less than 2 questions:
   - Every competency rating must be 0 to 2 out of 10.
   - Recommendation MUST be "Not Recommended".
   - RecommendationMessage MUST state clearly that candidate provided insufficient responses to evaluate competencies.
   - summary MUST detail in 3 to 4 sentences that the interaction was too brief or incomplete.
2. If the candidate answered technical questions well (overall average >= 7):
   - Ratings should accurately reflect their technical depth (7-10/10).
   - Recommendation MUST be "Recommended".
   - RecommendationMessage MUST state their clear technical strengths and alignment with the role.
   - summary MUST detail in 3 to 4 sentences their technical depth, practical examples, and communication clarity.
3. If the candidate had mixed or borderline performance (overall average 4 to 6):
   - Ratings must reflect partial competence (4-6/10).
   - Recommendation MUST be "Follow-up Required".
   - RecommendationMessage MUST state specific areas requiring follow-up assessment.
   - summary MUST summarize strengths vs areas needing further probing.

Respond strictly with a valid JSON object matching this schema:
{
  "feedback": {
    "rating": {
      "TechnicalSkills": 7,
      "Communication": 7,
      "ProblemSolving": 6,
      "Experience": 7,
      "Behavioral": 7,
      "Analysis": 7
    },
    "summary": "3 to 4 sentences analyzing candidate responses, technical depth, and overall performance.",
    "summery": "Same 3 to 4 sentences for backward compatibility.",
    "Recommendation": "Recommended",
    "RecommendationMessage": "One concise line summarizing hiring verdict."
  }
}
`;