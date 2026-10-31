'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-sage-700 border-t-transparent" />
    </div>
  );
}
