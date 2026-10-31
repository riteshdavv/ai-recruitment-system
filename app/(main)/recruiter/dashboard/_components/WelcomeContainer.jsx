"use client";
import { useUser } from '@/app/provider';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/services/supabaseClient';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

function WelcomeContainer() {
  const { user } = useUser();
  const [userData, setUserData] = useState({
    name: user?.name || 'User',
    picture: null
  });

  useEffect(() => {
    if (user?.email) {
      fetchLatestUserData();
    }
  }, [user]);

  const fetchLatestUserData = async () => {
    try {
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('name, picture')
        .eq('email', user.email)
        .single();

      if (!error && userRecord) {
        setUserData({
          name: userRecord.name || user?.name || user?.email?.split('@')[0] || 'User',
          picture: userRecord.picture || user?.picture
        });
      } else {
        setUserData({
          name: user?.name || user?.email?.split('@')[0] || 'User',
          picture: user?.picture
        });
      }

      if (typeof window !== 'undefined') {
        const googleProfile = localStorage.getItem('googleProfile');
        if (googleProfile) {
          const { name, picture } = JSON.parse(googleProfile);
          setUserData(prev => ({
            ...prev,
            name: name || prev.name,
            picture: picture || prev.picture
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData({
        name: user?.name || user?.email?.split('@')[0] || 'User',
        picture: user?.picture
      });
    }
  };

  return (
    <div className="bg-surface border border-line rounded-lg shadow-card p-5 sm:p-6 flex items-center justify-between">
      <div>
        <span className="text-xs font-medium tracking-wide uppercase text-sage-700">
          {getGreeting()}
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-ink mt-0.5">
          Welcome back, {userData.name}
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Automated voice screening and candidate assessment pipeline.
        </p>
      </div>

      {userData.picture ? (
        <Image
          src={userData.picture}
          alt={userData.name}
          width={48}
          height={48}
          className="rounded-full ring-1 ring-line object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-sage-200 text-sage-900 flex items-center justify-center font-medium text-base flex-shrink-0">
          {userData.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default WelcomeContainer;
