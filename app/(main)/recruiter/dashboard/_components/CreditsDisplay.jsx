'use client';
import React from 'react';
import { useUser } from '@/app/provider';
import { Coins, Plus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

function CreditsDisplay() {
  const { user } = useUser();
  const router = useRouter();

  const handleBuyCredits = () => {
    router.push('/recruiter/billing');
  };

  return (
    <div className="bg-surface border border-line rounded-lg shadow-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: icon + label + count */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-md bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-700">
          <Coins className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-1">Interview Credits</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-sage-800 font-mono tabular-nums leading-none">
              {user?.credits || 0}
            </span>
            {user?.credits <= 2 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning-soft border border-warning/20 rounded-full px-2 py-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {user?.credits === 0 ? 'No credits remaining' : 'Low credits'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: note */}
      <div className="hidden lg:block text-xs text-ink-muted border-l border-line pl-6 py-1">
        1 credit = 1 role creation. Share link with unlimited candidates.
      </div>

      {/* Right: Buy Credits CTA */}
      <Button
        onClick={handleBuyCredits}
        className="w-full sm:w-auto h-10 bg-sage-700 hover:bg-sage-800 text-white rounded-md font-medium text-sm"
      >
        <Plus className="w-4 h-4 mr-1.5" strokeWidth={2} />
        Buy Credits
      </Button>
    </div>
  );
}

export default CreditsDisplay;
