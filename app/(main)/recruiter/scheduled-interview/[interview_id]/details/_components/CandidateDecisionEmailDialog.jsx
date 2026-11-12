'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function CandidateDecisionEmailDialog({
  isOpen,
  onClose,
  decisionType = 'selected', // 'selected' | 'reevaluate' | 'rejected'
  candidate,
  initialSubject = '',
  initialMessage = '',
  companyName = 'RecruitAI Hiring Team',
}) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentResult, setSentResult] = useState(null);

  // Sync initial values whenever dialog opens or candidate/type changes
  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(candidate?.email || '');
      setSubject(initialSubject || '');
      setMessage(initialMessage || '');
      setSentResult(null);
    }
  }, [isOpen, candidate, initialSubject, initialMessage, decisionType]);

  const handleResetTemplate = () => {
    setSubject(initialSubject || '');
    setMessage(initialMessage || '');
    toast.info('Template text reset to default');
  };

  const handleSendEmail = async (e) => {
    e?.preventDefault();

    if (!recipientEmail.trim()) {
      toast.error('Recipient email address is required');
      return;
    }

    if (!subject.trim()) {
      toast.error('Email subject line cannot be empty');
      return;
    }

    if (!message.trim()) {
      toast.error('Email message body cannot be empty');
      return;
    }

    setLoading(true);
    setSentResult(null);

    try {
      const res = await axios.post('/api/interview/send-decision', {
        candidateEmail: recipientEmail.trim(),
        candidateName: candidate?.fullname || 'Candidate',
        jobPosition: candidate?.jobPosition || 'Role Specialist',
        decisionType,
        subject: subject.trim(),
        message: message.trim(),
        companyName,
      });

      if (res.data?.success) {
        toast.success(`Successfully dispatched email to ${recipientEmail}!`);
        setSentResult(res.data);
      } else {
        toast.error(res.data?.error || 'Failed to dispatch email.');
      }
    } catch (err) {
      console.error('Error dispatching decision email:', err);
      toast.error(
        err.response?.data?.error || 'Failed to send candidate email. Please verify SMTP settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Type-specific badge and styling
  const config = {
    selected: {
      title: 'Advance Candidate',
      subtitle: 'Dispatch an official invitation to the next hiring stage via SMTP.',
      badgeText: 'Next Stage Invitation',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <CheckCircle2 className="size-4 text-emerald-700" />,
      btnClass: 'bg-sage-700 hover:bg-sage-800 text-white',
      btnText: 'Send Invitation Email',
    },
    reevaluate: {
      title: 'Request Follow-up',
      subtitle: 'Dispatch a follow-up inquiry or additional interview request via SMTP.',
      badgeText: 'Follow-up Discussion',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Clock className="size-4 text-amber-700" />,
      btnClass: 'bg-amber-800 hover:bg-amber-900 text-white',
      btnText: 'Send Follow-up Email',
    },
    rejected: {
      title: 'Send Rejection',
      subtitle: 'Dispatch a respectful candidate application status update via SMTP.',
      badgeText: 'Application Status Update',
      badgeClass: 'bg-red-50 text-red-800 border-red-200',
      icon: <XCircle className="size-4 text-danger" />,
      btnClass: 'bg-danger hover:bg-danger/90 text-white',
      btnText: 'Send Rejection Email',
    },
  }[decisionType] || {
    title: 'Candidate Email',
    subtitle: 'Dispatch an automated email update via SMTP.',
    badgeText: 'Status Update',
    badgeClass: 'bg-sage-100 text-sage-800 border-sage-200',
    icon: <Mail className="size-4 text-sage-700" />,
    btnClass: 'bg-sage-700 hover:bg-sage-800 text-white',
    btnText: 'Send Email',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] w-full max-w-[95vw] overflow-hidden p-5 sm:p-6 z-[70] shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-sage-100 text-sage-800 flex items-center justify-center">
                {config.icon}
              </div>
              <DialogTitle className="text-lg font-semibold text-ink">
                {config.title}
              </DialogTitle>
            </div>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
            >
              {config.badgeText}
            </span>
          </div>
          <DialogDescription className="text-xs text-ink-muted">
            {config.subtitle}
          </DialogDescription>
        </DialogHeader>

        {sentResult ? (
          /* Sent Confirmation Screen */
          <div className="py-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-success-soft text-success mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-8" strokeWidth={2.2} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-ink">Email Successfully Dispatched</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                An official notification has been sent to{' '}
                <strong className="text-ink font-mono font-medium">{recipientEmail}</strong>.
              </p>
            </div>

            {sentResult.previewUrl && (
              <div className="p-3.5 bg-sage-50 rounded-lg border border-sage-200 text-left max-w-md mx-auto space-y-1.5">
                <span className="text-[11px] font-semibold text-sage-900 block">
                  Demo Sandbox Delivery:
                </span>
                <p className="text-[11px] text-ink-muted">
                  SMTP credentials are in test mode. You can view the live rendered HTML email in Ethereal Mail:
                </p>
                <a
                  href={sentResult.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sage-700 hover:text-sage-900 underline font-semibold pt-1"
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                  Open Live Email Preview in Browser &rarr;
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSentResult(null)}
                className="text-xs h-9"
              >
                Send Another Note
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                className="bg-sage-700 hover:bg-sage-800 text-white text-xs h-9"
              >
                Done & Return to Report
              </Button>
            </div>
          </div>
        ) : (
          /* Composer Form */
          <form onSubmit={handleSendEmail} className="space-y-3.5 py-2 w-full max-w-full">
            {/* Recipient */}
            <div>
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1">
                Candidate Recipient
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted size-3.5" />
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="pl-8 text-xs font-mono h-9"
                  required
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Subject Line
                </label>
                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="text-[11px] text-sage-700 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="size-3" />
                  Reset Template
                </button>
              </div>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject of notification email..."
                className="text-xs h-9 font-medium"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1">
                Message Body <span className="text-ink-muted font-normal text-[11px]">(Markdown & bullets supported)</span>
              </label>
              <Textarea
                rows={9}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write candidate message..."
                className="text-xs font-mono leading-relaxed resize-y max-h-[40vh]"
                required
              />
            </div>

            {/* SMTP Notice */}
            <div className="p-2.5 rounded-md bg-surface-alt border border-line text-[11px] text-ink-muted flex items-start gap-2">
              <Sparkles className="size-3.5 text-sage-700 shrink-0 mt-0.5" />
              <span>
                Formatted automatically into an executive email template with candidate greeting and hiring team sign-off.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={loading}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !recipientEmail || !message}
                className={`${config.btnClass} text-xs h-9 gap-1.5`}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Sending via SMTP...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    {config.btnText}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
