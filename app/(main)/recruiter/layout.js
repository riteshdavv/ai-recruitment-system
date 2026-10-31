'use client';
import React from 'react';
import DashboardProvider from './provider';
import { SpeedInsights } from '@vercel/speed-insights/next';

function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <div className="p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6 bg-sage-50 min-h-screen">
        {children}
      </div>
      <SpeedInsights />
    </DashboardProvider>
  );
}

export default DashboardLayout;
