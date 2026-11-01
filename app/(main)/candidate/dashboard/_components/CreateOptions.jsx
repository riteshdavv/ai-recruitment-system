"use client"
import { Phone, File as FileIcon, ArrowRight, Check } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/services/supabaseClient'

// Helper to extract clean UUID from full URL, path, or raw UUID
export const extractInterviewId = (input) => {
  if (!input) return '';
  const trimmed = input.trim();

  // Match standard 36-char UUID (8-4-4-4-12 hex format)
  const uuidMatch = trimmed.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Fallback if URL was pasted without standard hyphens
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        return segments[segments.length - 1];
      }
    }
  } catch {
    // Ignore URL parse error
  }

  if (trimmed.includes('/')) {
    const parts = trimmed.split(/[/?#]/).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }

  return trimmed;
};

function CreateOptions() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const detectedUUID = extractInterviewId(code);
  const isUrlPasted = code.trim().startsWith('http://') || code.trim().startsWith('https://') || code.trim().includes('/interview/');

  const handleStart = async () => {
    const interviewId = extractInterviewId(code);

    if (!interviewId) {
      toast.error('Please enter an interview link or UUID.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('Interviews')
      .select('interview_id')
      .eq('interview_id', interviewId)
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error('Invalid interview link or code. Please verify with your recruiter.');
      return;
    }

    toast.success('Interview verified. Loading session...');
    router.push(`/interview/${interviewId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Join with Interview Code or Link */}
      <div className="bg-surface rounded-lg border border-line p-5 sm:p-6 shadow-card flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700 mb-3.5">
            <Phone className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-ink">Join with Interview Link or Code</h3>
          <p className="text-sm text-ink-muted mt-1 mb-4 leading-relaxed">
            Paste either your full interview link or the 36-character interview UUID shared by your recruiting team to launch your voice interview session.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste interview link or UUID (e.g., c297729e-...)"
              className="h-10 text-xs sm:text-sm font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
            <Button
              onClick={handleStart}
              disabled={loading}
              className="h-10 px-4 bg-sage-700 hover:bg-sage-800 text-white rounded-md shrink-0 text-sm font-medium"
            >
              {loading ? 'Verifying...' : 'Start'}
            </Button>
          </div>

          {/* Realtime extraction feedback when user pastes a full link */}
          {isUrlPasted && detectedUUID && (
            <div className="flex items-center gap-1.5 text-xs text-sage-700 bg-sage-50 px-2.5 py-1 rounded border border-sage-200">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Detected ID: <strong className="font-mono">{detectedUUID}</strong>
              </span>
            </div>
          )}

          <p className="text-[11px] text-ink-muted">
            Accepts full URLs (e.g., <span className="font-mono">https://.../interview/uuid</span>) or raw UUID codes.
          </p>
        </div>
      </div>

      {/* Upload CV */}
      <Link href="/candidate/upload-cv" className="block">
        <div className="bg-surface rounded-lg border border-line p-5 sm:p-6 shadow-card hover:border-sage-300 hover:shadow-md transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700 mb-3.5 group-hover:bg-sage-200 transition-colors">
              <FileIcon className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-semibold text-ink">Upload Candidate Resume</h3>
            <p className="text-sm text-ink-muted mt-1 mb-4 leading-relaxed">
              Upload your CV or résumé so recruiters can review your background alongside your AI interview performance.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-sage-700 pt-3 border-t border-line">
            <span>Manage CV profile</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.75} />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default CreateOptions;
