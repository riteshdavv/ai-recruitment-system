"use client"
import { Phone, File as FileIcon, ArrowRight } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/services/supabaseClient'

function CreateOptions() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (!code.trim()) {
      toast.error('Please enter an interview code.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('Interviews')
      .select('interview_id')
      .eq('interview_id', code.trim())
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error('Invalid interview code. Please verify with your recruiter.');
      return;
    }

    toast.success('Interview verified. Loading session...');
    router.push(`/interview/${code.trim()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Join with Interview Code */}
      <div className="bg-surface rounded-lg border border-line p-5 sm:p-6 shadow-card flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700 mb-3.5">
            <Phone className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-ink">Join with Interview Code</h3>
          <p className="text-sm text-ink-muted mt-1 mb-4 leading-relaxed">
            Enter the unique code or link shared by your recruiting team to launch your voice interview session.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste interview code (e.g., UUID)"
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
