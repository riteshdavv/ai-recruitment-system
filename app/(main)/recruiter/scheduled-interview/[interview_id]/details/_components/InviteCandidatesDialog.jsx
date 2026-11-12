'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Loader2, CheckCircle2, ExternalLink, Sparkles, Copy } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function InviteCandidatesDialog({ interviewDetail, triggerButton }) {
  const [open, setOpen] = useState(false);
  const [candidateEmails, setCandidateEmails] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentSummary, setSentSummary] = useState(null);

  const baseUrl = (
    process.env.NEXT_PUBLIC_HOST_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');
  const interviewUrl = `${baseUrl}/interview/${interviewDetail?.interview_id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(interviewUrl);
    toast.success('Interview link copied to clipboard');
  };

  const handleSendInvites = async (e) => {
    e.preventDefault();
    if (!candidateEmails.trim()) {
      toast.error('Please enter at least one candidate email address');
      return;
    }

    setLoading(true);
    setSentSummary(null);

    try {
      const res = await axios.post('/api/interview/send-invite', {
        interview_id: interviewDetail?.interview_id,
        candidates: candidateEmails,
        jobPosition: interviewDetail?.jobPosition || 'Role Specialist',
        jobDescription: interviewDetail?.jobDescription || '',
        duration: interviewDetail?.duration || '15 Min',
        customMessage: customNote,
        companyName: 'RecruitAI Partner Team',
      });

      if (res.data?.success) {
        toast.success(`Successfully sent ${res.data.sentCount} invitation email(s)!`);
        setSentSummary(res.data);
        setCandidateEmails('');
      } else {
        toast.error(res.data?.error || 'Failed to dispatch emails.');
      }
    } catch (err) {
      console.error('Error sending invitations:', err);
      toast.error(err.response?.data?.error || 'Failed to send candidate email invitations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            size="sm"
            className="bg-sage-700 hover:bg-sage-800 text-white text-xs font-medium"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
            Invite Candidates
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-md bg-sage-100 text-sage-800 flex items-center justify-center">
              <Mail className="size-4" />
            </div>
            <DialogTitle className="text-lg font-semibold text-ink">
              Invite Candidates to Interview
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink-muted">
            Send an automated voice interview invitation to one or more candidate emails for{' '}
            <strong className="text-ink font-medium">{interviewDetail?.jobPosition}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendInvites} className="space-y-4 py-2">
          {/* Quick link copy bar */}
          <div className="p-3 bg-surface-alt rounded-md border border-line flex items-center justify-between gap-2 text-xs">
            <span className="font-mono text-ink-muted truncate max-w-[320px]">{interviewUrl}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-7 px-2 text-[11px] shrink-0"
            >
              <Copy className="size-3 mr-1" /> Copy
            </Button>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1">
              Candidate Email(s)
            </label>
            <Input
              placeholder="candidate1@example.com, candidate2@gmail.com"
              value={candidateEmails}
              onChange={(e) => setCandidateEmails(e.target.value)}
              className="text-xs font-mono"
            />
            <p className="text-[11px] text-ink-muted mt-1">
              Separate multiple emails with commas, spaces, or semicolons.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1">
              Custom Message <span className="text-ink-muted font-normal text-[11px]">(Optional)</span>
            </label>
            <Textarea
              placeholder="Hi there, please complete this 15-minute voice screening by Friday..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Delivery result preview */}
          {sentSummary && (
            <div className="p-3.5 rounded-md bg-sage-50 border border-sage-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-sage-900">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success" />
                  {sentSummary.sentCount} Invitation(s) Dispatched
                </span>
                <span className="text-[11px] text-sage-700 font-normal">
                  {sentSummary.failedCount > 0 ? `${sentSummary.failedCount} failed` : "All delivered"}
                </span>
              </div>

              {sentSummary.previewUrls && sentSummary.previewUrls.length > 0 && (
                <div className="pt-2 border-t border-sage-200/60 space-y-1">
                  <span className="text-[11px] font-semibold text-sage-800 block">
                    Demo Email Previews (Click to view):
                  </span>
                  {sentSummary.previewUrls.map((p, idx) => (
                    <a
                      key={idx}
                      href={p.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[11px] text-sage-700 hover:text-sage-900 underline truncate"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      Preview {p.email}: {p.previewUrl}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs h-9"
            >
              Close
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !candidateEmails.trim()}
              className="bg-sage-700 hover:bg-sage-800 text-white text-xs h-9 gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  Send Invites
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

