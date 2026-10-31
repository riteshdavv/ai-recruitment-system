'use client';
import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-sage-50 text-ink">
      <main className="container mx-auto p-4 sm:p-6">
        {children}
      </main>
      <SpeedInsights />
    </div>
  );
}
