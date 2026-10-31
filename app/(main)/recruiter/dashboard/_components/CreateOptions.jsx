import { Phone, Video, Coins, AlertCircle } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import { useUser } from '@/app/provider'
import { Button } from '@/components/ui/button'

function CreateOptions() {
  const { user } = useUser();
  const hasCredits = (user?.credits || 0) > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card 1: Create Interview */}
      <div className={`relative ${!hasCredits ? 'opacity-60' : ''}`}>
        <Link href={hasCredits ? '/recruiter/dashboard/create-interview' : '#'}>
          <div
            className={`bg-surface rounded-lg border border-line shadow-card p-5 sm:p-6 transition-all
              ${hasCredits
                ? 'cursor-pointer hover:border-sage-300 hover:shadow-md'
                : 'cursor-not-allowed'
              }`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center text-sage-700">
                <Video className="w-5 h-5" strokeWidth={1.75} />
              </div>
              {!hasCredits && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-danger bg-danger-soft border border-danger/20 rounded-full px-2.5 py-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No credits
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-ink">Create Voice AI Interview</h3>
            <p className="text-sm text-ink-muted mt-1 mb-4 leading-relaxed">
              Define the role, generate structured questions with AI, and share the interview link with candidates.
            </p>

            {/* Bottom badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-800 bg-sage-100 border border-sage-200 rounded-full px-2.5 py-0.5">
              <Coins className="w-3.5 h-3.5 text-sage-700" />
              Costs 1 credit
            </span>
          </div>
        </Link>

        {!hasCredits && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-lg backdrop-blur-[1px]">
            <Button
              onClick={() => window.location.href = '/recruiter/billing'}
              className="bg-sage-700 hover:bg-sage-800 text-white shadow-card"
            >
              Buy Credits to Create
            </Button>
          </div>
        )}
      </div>

      {/* Card 2: Phone Screening (Coming Soon) */}
      <div className="relative bg-surface-alt rounded-lg border border-dashed border-line shadow-xs p-5 sm:p-6">
        <div className="absolute top-5 right-5">
          <span className="text-xs text-ink-muted bg-sage-100 rounded-full px-2.5 py-0.5 font-medium border border-line">
            Coming Soon
          </span>
        </div>

        <div className="w-10 h-10 rounded-md bg-sage-100/60 flex items-center justify-center mb-4 text-ink-muted">
          <Phone className="w-5 h-5" strokeWidth={1.75} />
        </div>

        <h3 className="text-lg font-semibold text-ink-muted">Automated Phone Screen</h3>
        <p className="text-sm text-ink-muted/80 mt-1 leading-relaxed">
          Trigger outbound automated phone screenings directly to candidate numbers with real-time call transcripts.
        </p>
      </div>
    </div>
  )
}

export default CreateOptions
