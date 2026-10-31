import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

function InterviewHeader() {
  return (
    <header className="bg-white border-b border-line shadow-xs">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 flex items-center">
        <Link href="/" className="flex-shrink-0">
          <Logo size="md" />
        </Link>
      </div>
    </header>
  );
}

export default InterviewHeader;
