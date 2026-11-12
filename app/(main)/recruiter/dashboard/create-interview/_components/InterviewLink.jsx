'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Linkedin,
  Mail,
  Phone,
  Plus,
  CheckCircle2,
  Send,
  Loader2,
  ExternalLink,
  Sparkles,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

const InterviewLink = ({ interview_id, formData }) => {
  const router = useRouter();
  
  const baseUrl = (process.env.NEXT_PUBLIC_HOST_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, '');
  const url = `${baseUrl}/interview/${interview_id}`;

  const [candidateEmails, setCandidateEmails] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sentSummary, setSentSummary] = useState(null);

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Interview link copied to clipboard');
  };

  const handleSendAutomatedInvites = async (e) => {
    e.preventDefault();
    if (!candidateEmails.trim()) {
      toast.error('Please enter at least one candidate email address');
      return;
    }

    setIsSendingEmail(true);
    setSentSummary(null);

    try {
      const res = await axios.post('/api/interview/send-invite', {
        interview_id,
        candidates: candidateEmails,
        jobPosition: formData?.jobPosition || 'Technical Specialist',
        jobDescription: formData?.jobDescription || '',
        duration: formData?.duration || '15 Min',
        customMessage: customNote,
        companyName: formData?.companyName || 'Recruitment Team',
      });

      if (res.data?.success) {
        toast.success(`Successfully dispatched ${res.data.sentCount} candidate invitation email(s)!`);
        setSentSummary(res.data);
        setCandidateEmails('');
      } else {
        toast.error(res.data?.error || 'Failed to dispatch emails.');
      }
    } catch (err) {
      console.error('Error sending invitations:', err);
      toast.error(err.response?.data?.error || 'Failed to send candidate email invitations.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const shareVia = (platform) => {
    const interviewTitle = formData?.jobPosition || 'AI Interview';
    const defaultMessage = `Join our ${interviewTitle} voice AI interview: ${url}`;
    const emailSubject = `Invitation: ${interviewTitle} Interview Session`;
    const emailBody = `Hello,\n\nYou have been invited to participate in an automated voice AI interview for the ${interviewTitle} position.\n\nAccess your interview session here:\n${url}\n\nPlease complete the session in a quiet environment with a working microphone.\n\nBest regards,\nRecruitment Team`;
    
    switch(platform) {
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(defaultMessage)}`, '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success banner card */}
      <div className="bg-surface rounded-lg border border-line p-6 shadow-card text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-success-soft text-success mx-auto flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-semibold text-ink">Interview Pipeline Configured</h2>
        <p className="text-xs text-ink-muted max-w-md mx-auto">
          Your AI voice interview is live and ready. Invite candidates directly via automated email or share your session link.
        </p>
      </div>

      {/* Automated Email Invite Card */}
      <div className="bg-surface rounded-lg border border-line p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sage-100 text-sage-800 flex items-center justify-center">
              <Mail className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Automated Candidate Email Invites</h3>
              <p className="text-[11px] text-ink-muted">Send branded voice interview invitations directly to applicants' inboxes</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-sage-800 bg-sage-100 border border-sage-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="size-3" /> Auto-Deliver
          </span>
        </div>

        <form onSubmit={handleSendAutomatedInvites} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1">
              Candidate Email(s)
            </label>
            <Input
              placeholder="candidate@example.com, applicant2@gmail.com (comma or space separated)"
              value={candidateEmails}
              onChange={(e) => setCandidateEmails(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1">
              Personalized Note <span className="text-ink-muted font-normal text-[11px]">(Optional)</span>
            </label>
            <Textarea
              placeholder="We were impressed by your background and invite you to complete this 15-minute AI Voice Screening."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isSendingEmail || !candidateEmails.trim()}
            className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white text-xs font-medium flex items-center justify-center gap-2"
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Dispatching Automated Email(s)...
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                Send Automated Invites
              </>
            )}
          </Button>
        </form>

        {/* Delivery feedback & preview links if test mode */}
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
                <div className="pt-2 border-t border-sage-200/60 space-y-1.5 min-w-0">
                  <span className="text-[11px] font-semibold text-sage-800 block">
                    Demo Mode Previews (SMTP not configured on Vercel):
                  </span>
                  {sentSummary.previewUrls.map((p, idx) => (
                    <a
                      key={idx}
                      href={p.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-sage-700 hover:text-sage-900 underline font-medium truncate max-w-full"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      <span className="truncate">Preview test email sent to {p.email} &rarr;</span>
                    </a>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>

      {/* URL Copy Card */}
      <div className="bg-surface rounded-lg border border-line p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Direct Session Link</span>
          <span className="text-xs font-medium text-sage-800 bg-sage-100 border border-sage-200 px-2.5 py-0.5 rounded-full">
            Active link
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Input value={url} readOnly className="font-mono text-xs bg-surface-alt" />
          <Button onClick={onCopyLink} className="h-10 bg-sage-700 hover:bg-sage-800 text-white shrink-0 text-xs font-medium">
            <Copy className="size-3.5 mr-1.5" /> 
            Copy Link
          </Button>
        </div>

        <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-sage-600" />
            Duration: {formData?.duration || '15 Min'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-sage-600" />
            Link valid indefinitely
          </span>
        </div>
      </div>

      {/* Share Actions */}
      <div className="bg-surface rounded-lg border border-line p-5 shadow-card space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block">Other Share Channels</span>
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" size="sm" onClick={() => shareVia('email')} className="text-xs h-9">
            <Mail className="size-3.5 mr-1.5 text-sage-700" /> Default Mail Client
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareVia('linkedin')} className="text-xs h-9">
            <Linkedin className="size-3.5 mr-1.5 text-sage-700" /> LinkedIn
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareVia('whatsapp')} className="text-xs h-9">
            <Phone className="size-3.5 mr-1.5 text-sage-700" /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Nav Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button 
          variant="outline" 
          onClick={() => router.push('/recruiter/dashboard')}
          className="flex-1 text-xs font-medium h-10"
        >
          <ArrowLeft className="size-3.5 mr-1.5" /> Return to Dashboard
        </Button>
        <Button 
          onClick={() => router.push('/recruiter/dashboard/create-interview')}
          className="flex-1 text-xs font-medium h-10 bg-sage-700 hover:bg-sage-800 text-white"
        >
          <Plus className="size-3.5 mr-1.5" /> Create Another Role
        </Button>
      </div>
    </div>
  );
};

export default InterviewLink;
