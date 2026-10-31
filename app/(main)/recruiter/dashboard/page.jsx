'use client';
import React from 'react';
import WelcomeContainer from './_components/WelcomeContainer';
import StatsCards from './_components/StatsCards';
import CreditsDisplay from './_components/CreditsDisplay';
import CreateOptions from './_components/CreateOptions';
import LatestInterviewsList from './_components/LatestInterviewsList';

function Dashboard() {
  return (
    <div className="space-y-6">
      <WelcomeContainer />
      <StatsCards />
      <CreditsDisplay />
      <CreateOptions />
      <LatestInterviewsList />
    </div>
  );
}

export default Dashboard;
