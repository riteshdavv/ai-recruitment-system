'use client';

import { useState, useEffect } from 'react';
import Dropzone from 'shadcn-dropzone';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';
import {
  FileText,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Download,
  ExternalLink,
  Sparkles,
  Target,
  AlertCircle,
  Lightbulb,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const COMMON_ROLES = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Python Developer',
  'DevOps Engineer',
  'Data Scientist',
];

export default function UploadCV() {
  const [loading, setLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Target job role state
  const [jobRole, setJobRole] = useState('Full Stack Developer');
  const [parsedText, setParsedText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error('User not logged in');
        return;
      }

      const userEmail = session.user.email;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (userError) {
        console.error('Failed to fetch user:', userError);
        toast.error('Failed to load user data');
        return;
      }

      setUser(userData);

      // Restore saved parsed data from Database
      if (userData?.cv_target_role) {
        setJobRole(userData.cv_target_role);
      }

      if (userData?.cv_parsed_data) {
        setAnalysis(userData.cv_parsed_data);
      }

      if (userData?.cv_parsed_text) {
        setParsedText(userData.cv_parsed_text);
      } else {
        const cached = localStorage.getItem(`cv_analysis_${userData.id}`);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            if (!userData?.cv_parsed_data) setAnalysis(parsedCache.analysis);
            setParsedText(parsedCache.text || '');
            if (!userData?.cv_target_role && parsedCache.jobRole) setJobRole(parsedCache.jobRole);
          } catch (e) {
            console.error('Cache parse error:', e);
          }
        }
      }
    }

    fetchUser();
  }, []);

  const handleFileDrop = (files) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  // Upload and immediately trigger AI parsing & scoring
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error('Please select a CV before submitting.');
      return;
    }
    if (!user) {
      toast.error('User not loaded.');
      return;
    }

    setLoading(true);

    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `cv.${fileExt}`;
      const filePath = `cv/${user.id}/${fileName}`;

      // 1. Upload PDF to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(filePath, uploadedFile, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Update user cv_file_path in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ cv_file_path: filePath })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setUser((prev) => ({ ...prev, cv_file_path: filePath }));
      toast.success('Resume PDF uploaded successfully.');

      // 3. Immediately trigger AI parsing and scoring via OpenRouter
      await runAiAnalysis(uploadedFile, filePath, jobRole);

      setUploadedFile(null);
    } catch (error) {
      console.error('Resume upload error:', error?.message || error);
      const msg = error?.message || 'Failed to upload resume.';
      toast.error(msg === 'Bucket not found' ? 'Storage bucket "cv-uploads" not found in Supabase.' : msg);
    } finally {
      setLoading(false);
    }
  };

  // Run AI analysis & scoring with OpenRouter
  const runAiAnalysis = async (fileToParse, existingPath, targetRole) => {
    setScoringLoading(true);
    try {
      let res;
      if (fileToParse) {
        const formData = new FormData();
        formData.append('file', fileToParse);
        formData.append('jobRole', targetRole);
        res = await fetch('/api/candidate/parse-cv', {
          method: 'POST',
          body: formData,
        });
      } else if (existingPath) {
        res = await fetch('/api/candidate/parse-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cvFilePath: existingPath,
            jobRole: targetRole,
            text: parsedText || undefined,
          }),
        });
      } else {
        toast.error('No resume document found to analyze.');
        setScoringLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to parse resume.');
      }

      setAnalysis(data.analysis);
      if (data.text) setParsedText(data.text);

      // Persist to Supabase Database across all devices
      if (user?.id) {
        try {
          const { error: dbError } = await supabase
            .from('users')
            .update({
              cv_parsed_data: data.analysis,
              cv_score: data.analysis?.score || null,
              cv_target_role: targetRole,
              cv_parsed_text: data.text || null,
            })
            .eq('id', user.id);

          if (dbError) {
            console.warn('Database save warning (run supabase migration if columns missing):', dbError.message);
          }
        } catch (dbErr) {
          console.warn('Database update catch:', dbErr);
        }

        // Also keep local cache as instant fallback
        localStorage.setItem(
          `cv_analysis_${user.id}`,
          JSON.stringify({
            analysis: data.analysis,
            text: data.text,
            jobRole: targetRole,
          })
        );
      }

      toast.success(`Resume scored: ${data.analysis?.score || 0}/100 match for ${targetRole}!`);
    } catch (err) {
      console.error('AI Analysis error:', err);
      toast.error(err.message || 'Failed to analyze resume with AI.');
    } finally {
      setScoringLoading(false);
    }
  };

  // Re-run scoring against new role
  const handleRescore = async () => {
    if (!jobRole.trim()) {
      toast.error('Please enter a target job role.');
      return;
    }
    await runAiAnalysis(uploadedFile || null, user?.cv_file_path || null, jobRole.trim());
  };

  // Open PDF in new tab for direct viewing
  const handleView = () => {
    if (!user?.cv_file_path) return;
    const { data } = supabase.storage
      .from('cv-uploads')
      .getPublicUrl(user.cv_file_path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  const handleDownload = async () => {
    if (!user?.cv_file_path) {
      toast.error('No CV found to download.');
      return;
    }

    try {
      // 1. Try public URL fetch first
      const { data: publicData } = supabase.storage
        .from('cv-uploads')
        .getPublicUrl(user.cv_file_path);

      if (publicData?.publicUrl) {
        try {
          const res = await fetch(publicData.publicUrl);
          if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${user?.name || 'Candidate'}_Resume.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Resume downloaded successfully.');
            return;
          }
        } catch (fetchErr) {
          console.warn("Public fetch failed, trying signed URL:", fetchErr);
        }
      }

      // 2. Try signed URL
      const { data: signedData } = await supabase.storage
        .from('cv-uploads')
        .createSignedUrl(user.cv_file_path, 60);

      if (signedData?.signedUrl) {
        const res = await fetch(signedData.signedUrl);
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${user?.name || 'Candidate'}_Resume.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('Resume downloaded successfully.');
          return;
        }
      }

      // 3. Fallback: storage.download()
      const { data, error } = await supabase.storage
        .from('cv-uploads')
        .download(user.cv_file_path);

      if (!error && data) {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user?.name || 'Candidate'}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Resume downloaded successfully.');
        return;
      }

      throw error || new Error('Storage download returned no data');
    } catch (err) {
      console.error('Download error:', err);
      // Last resort: open public URL directly in new tab
      const { data } = supabase.storage.from('cv-uploads').getPublicUrl(user.cv_file_path);
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
        toast.info('Opened resume in a new tab.');
      } else {
        toast.error('Failed to download CV: ' + (err?.message || 'Storage error'));
      }
    }
  };

  const handleDelete = async () => {
    if (!user || !user.cv_file_path) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase.storage
        .from('cv-uploads')
        .remove([user.cv_file_path]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          cv_file_path: null,
          cv_parsed_data: null,
          cv_score: null,
          cv_target_role: null,
          cv_parsed_text: null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser((prev) => ({ ...prev, cv_file_path: null }));
      setAnalysis(null);
      setParsedText('');
      if (user?.id) localStorage.removeItem(`cv_analysis_${user.id}`);
      toast.success('Resume deleted.');
    } catch (error) {
      console.error('Resume delete error:', error);
      toast.error(error?.message || 'Failed to delete resume.');
    } finally {
      setLoading(false);
    }
  };

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success border-success/30 bg-success-soft';
    if (score >= 60) return 'text-sage-700 border-sage-300 bg-sage-50';
    if (score >= 40) return 'text-amber-700 border-amber-300 bg-amber-50';
    return 'text-danger border-danger/30 bg-danger-soft';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/candidate/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-ink-muted hover:text-ink hover:bg-sage-100">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink flex items-center gap-2">
            Resume & AI Role Matcher
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Upload your resume PDF to extract skills, view parsed content, and calculate an ATS score against your target role.
          </p>
        </div>
      </div>

      {/* Target Job Role Selector Card */}
      <Card className="bg-surface border-line shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
            <Target className="w-4 h-4 text-sage-700" />
            Target Job Role for Evaluation
          </CardTitle>
          <CardDescription className="text-xs text-ink-muted">
            The AI evaluates your resume against specific keywords, required competencies, and standards for this role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., Full Stack Developer, Machine Learning Engineer..."
              className="h-10 text-sm font-medium"
              disabled={scoringLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleRescore()}
            />
            {user?.cv_file_path && (
              <Button
                onClick={handleRescore}
                disabled={scoringLoading}
                className="h-10 px-4 bg-sage-700 hover:bg-sage-800 text-white shrink-0 text-xs font-medium flex items-center gap-1.5"
              >
                {scoringLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Score against role
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Quick select pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-ink-muted mr-1">Quick select:</span>
            {COMMON_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setJobRole(role)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  jobRole.toLowerCase() === role.toLowerCase()
                    ? 'bg-sage-700 text-white border-sage-700'
                    : 'bg-sage-50 text-ink-muted border-line hover:border-sage-300 hover:text-ink'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PDF Upload / Management Card */}
      <Card className="bg-surface border-line shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-sage-700" />
            Resume PDF Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user === undefined ? (
            <div className="h-44 bg-surface rounded-lg border border-line animate-pulse" />
          ) : user?.cv_file_path ? (
            <div className="space-y-4 py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-sage-50 border border-line">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-md bg-sage-100 text-sage-700 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
                      <span>Resume on file</span>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      PDF uploaded and analyzed for recruiters & voice sessions
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleView}
                    className="text-xs h-9 border-line hover:bg-sage-100 text-ink flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="text-xs h-9 border-line hover:bg-sage-100 text-ink flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-danger hover:bg-danger-soft hover:text-danger hover:border-danger/30 text-xs h-9"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ink">
                  Upload PDF document
                </label>

                <div className="rounded-lg border border-dashed border-sage-300 hover:border-sage-700 transition-colors p-4 bg-sage-50/50">
                  <Dropzone
                    onDropAccepted={handleFileDrop}
                    accept={{ 'application/pdf': ['.pdf'] }}
                    maxFiles={1}
                  />
                </div>

                {uploadedFile && (
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-sage-100 border border-sage-200 text-xs text-ink">
                    <FileText className="w-4 h-4 text-sage-700 flex-shrink-0" />
                    <span className="font-medium truncate">{uploadedFile.name}</span>
                    <span className="text-ink-muted ml-auto font-mono text-[11px]">
                      {(uploadedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !uploadedFile}
                className="w-full h-10 text-xs font-medium bg-sage-700 hover:bg-sage-800 text-white flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading & Analyzing with AI...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Upload & Score Resume with AI
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* AI Scoring Loading State */}
      {scoringLoading && (
        <Card className="bg-surface border-line shadow-card border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-sage-700">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="absolute -inset-1 rounded-full border border-sage-400 animate-ping opacity-25" />
            </div>
            <h3 className="text-base font-semibold text-ink">Analyzing Resume with OpenRouter AI...</h3>
            <p className="text-xs text-ink-muted max-w-sm">
              Extracting technical competencies, evaluating keyword density, and calculating match against{' '}
              <strong className="text-ink">{jobRole}</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Scoring & Parsed Breakdown Display */}
      {analysis && !scoringLoading && (
        <div className="space-y-6">
          {/* Main Score Hero Card */}
          <Card className="bg-surface border-line shadow-card overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-sage-50 to-surface border-b border-line">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-sage-800">
                      ATS Match Analysis
                    </span>
                    <Badge variant="outline" className={`text-xs font-medium ${getScoreColor(analysis.score || 0)}`}>
                      {analysis.scoreBand || 'Evaluated'}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-ink">
                    Target Role: <span className="text-sage-800">{jobRole}</span>
                  </h2>
                  <p className="text-xs text-ink-muted leading-relaxed max-w-xl">
                    {analysis.matchHeadline || analysis.summary}
                  </p>
                </div>

                {/* Score Number Circle */}
                <div className="flex items-center gap-3 bg-surface p-3.5 rounded-xl border border-line shadow-sm shrink-0">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-ink font-mono">
                      {analysis.score || 0}
                      <span className="text-sm font-normal text-ink-muted">/100</span>
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-ink-muted tracking-wider">
                      Role Match
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Executive Summary */}
              {analysis.summary && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Profile Summary
                  </h4>
                  <p className="text-sm text-ink leading-relaxed bg-sage-50/50 p-3.5 rounded-lg border border-line">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* Identified Skills Pills */}
              {analysis.topSkills && analysis.topSkills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Extracted Core Competencies & Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.topSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-md bg-sage-100 text-sage-800 font-medium border border-sage-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Matching Strengths */}
                <div className="p-4 rounded-lg bg-surface border border-line space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Role Match Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysis.matchingStrengths && analysis.matchingStrengths.length > 0 ? (
                      analysis.matchingStrengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-ink leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-ink-muted">No specific strengths highlighted.</li>
                    )}
                  </ul>
                </div>

                {/* Skill Gaps & Missing Keywords */}
                <div className="p-4 rounded-lg bg-surface border border-line space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Missing Skills & Gaps
                  </h4>
                  <ul className="space-y-2">
                    {analysis.skillGaps && analysis.skillGaps.length > 0 ? (
                      analysis.skillGaps.map((gap, idx) => (
                        <li key={idx} className="text-xs text-ink leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{gap}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-ink-muted">No major skill gaps identified.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              {analysis.actionableTips && analysis.actionableTips.length > 0 && (
                <div className="p-4 rounded-lg bg-sage-50 border border-line space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-sage-800 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-sage-700" />
                    Actionable Tips to Boost Your Score
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.actionableTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-ink leading-relaxed flex items-start gap-2">
                        <span className="text-sage-700 font-bold shrink-0">{idx + 1}.</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Collapsible Parsed Text Section */}
              {parsedText && (
                <div className="border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="flex items-center justify-between w-full text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                  >
                    <span>View Raw Extracted Text from PDF</span>
                    {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showRawText && (
                    <div className="mt-3 p-3 bg-sage-50 rounded-md border border-line max-h-60 overflow-y-auto text-xs font-mono text-ink-muted whitespace-pre-wrap leading-relaxed">
                      {parsedText}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
