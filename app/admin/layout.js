'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@/app/provider';
import { useRouter, usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

function AdminLayout({ children }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('Admin Layout - Current user:', user);
    console.log('Admin Layout - User email:', user?.email);
    console.log('Admin Layout - Current path:', pathname);
    
    // If we're on the login page, don't check authentication
    if (pathname === '/admin/login') {
      setIsChecking(false);
      return;
    }
    
    // If user is still loading (undefined), wait
    if (user === undefined) {
      setIsChecking(true);
      return;
    }
    
    // If user is not logged in, redirect to login
    if (!user) {
      console.log('Admin Layout - No user found, redirecting to admin login');
      router.push('/admin/login');
      return;
    }
    
    // Check if user is banned
    if (user.banned) {
      console.log('Admin Layout - User is banned, signing out');
      supabase.auth.signOut();
      toast.error('Your account has been banned. Please contact support for more information.');
      router.push('/admin/login');
      return;
    }
    
    // Check if user email contains @admin
    console.log('Admin Layout - Checking if', user.email, 'contains @admin');
    
    if (!user.email.includes('@admin') && !user.email.includes('@superadmin')) {
      console.log('Admin Layout - User not admin or superadmin, redirecting to dashboard');
      router.push('/users');
      return;
    }
    
    console.log('Admin Layout - User is admin, allowing access');
    setIsChecking(false);
  }, [user, router, pathname]);

  // If we're on the login page, render without admin layout
  if (pathname === '/admin/login') {
    return children;
  }

  if (user === undefined || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-sage-50">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-card bg-surface border border-line">
          <Shield className="w-10 h-10 text-sage-700 animate-pulse" />
          <h2 className="text-lg font-semibold text-ink">Verifying Admin Access...</h2>
          <p className="text-xs text-ink-muted">Please wait while we verify your permissions.</p>
          <div className="w-32 h-1.5 bg-sage-200 rounded-full overflow-hidden">
            <div className="h-full bg-sage-700 animate-pulse rounded-full w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50 text-ink">
      {/* Simple Admin Header */}
      <header className="bg-surface shadow-card border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Logo size="md" href="/" />
              <div className="h-5 w-px bg-line" />
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-sage-700" />
                <h1 className="text-sm font-semibold text-ink">Admin Console</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-ink-muted">
                Signed in as <strong className="text-ink">{user?.name || 'Admin'}</strong>
              </span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="text-xs text-danger hover:underline font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 py-2">
            <a
              href="/admin"
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/admin' 
                  ? 'bg-sage-100 text-sage-900 font-semibold' 
                  : 'text-ink-muted hover:text-ink hover:bg-sage-50'
              }`}
            >
              Dashboard
            </a>
            <a
              href="/admin/users"
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/admin/users' 
                  ? 'bg-sage-100 text-sage-900 font-semibold' 
                  : 'text-ink-muted hover:text-ink hover:bg-sage-50'
              }`}
            >
              Users
            </a>
            <a
              href="/admin/interviews"
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/admin/interviews' 
                  ? 'bg-sage-100 text-sage-900 font-semibold' 
                  : 'text-ink-muted hover:text-ink hover:bg-sage-50'
              }`}
            >
              Interviews
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout; 