-- Run this in your Supabase SQL Editor if you want to enforce the foreign key relationship
-- between interview_results and Interviews in Postgres / PostgREST:

ALTER TABLE interview_results 
ADD CONSTRAINT fk_interview_results_interview 
FOREIGN KEY (interview_id) 
REFERENCES "Interviews"(interview_id) 
ON DELETE CASCADE;
