'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sage-50 text-ink flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-line rounded-xl shadow-card p-8 text-center space-y-4">
        <div className="font-mono text-4xl font-bold text-sage-700">404</div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Page not found
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

