import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Clock, Copy, Linkedin, Mail, Phone, Plus, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

const InterviewLink = ({ interview_id, formData }) => {
  const router = useRouter();
  
  const baseUrl = (process.env.NEXT_PUBLIC_HOST_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, '');
  const url = `${baseUrl}/interview/${interview_id}`;

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Interview link copied to clipboard');
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
          Share this unique URL with candidates. Each applicant receives a personalized, voice-conducted session.
        </p>
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
            Duration: {formData.duration || '15 Min'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-sage-600" />
            Link valid indefinitely
          </span>
        </div>
      </div>

      {/* Share Actions */}
      <div className="bg-surface rounded-lg border border-line p-5 shadow-card space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block">Direct Invitation</span>
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" size="sm" onClick={() => shareVia('email')} className="text-xs h-9">
            <Mail className="size-3.5 mr-1.5 text-sage-700" /> Email
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
