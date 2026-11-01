'use client';
import { useState, useEffect } from 'react';
import Dropzone from 'shadcn-dropzone';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';
import { FileText, Trash2, UploadCloud, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function UploadCV() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error('User not logged in');
        return;
      }

      const userEmail = session.user.email;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, cv_file_path')
        .eq('email', userEmail)
        .single();

      if (userError) {
        console.error('Failed to fetch user:', userError);
        toast.error('Failed to load user data');
        return;
      }

      setUser(userData);
    }

    fetchUser();
  }, []);

  const handleFileDrop = (files) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile) {
      toast.error('Please select a CV before submitting.');
      return;
    }
    if (!user) {
      toast.error('User not loaded.');
      return;
    }

    setLoading(true);

    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `cv.${fileExt}`;
      const filePath = `cv/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(filePath, uploadedFile, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ cv_file_path: filePath })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setUser({ ...user, cv_file_path: filePath });
      setUploadedFile(null);
      toast.success('Resume uploaded successfully.');
    } catch (error) {
      console.error("Resume upload error:", error?.message || error?.error || error);
      const msg = error?.message || error?.error_description || error?.error || 'Failed to upload resume.';
      toast.error(msg === 'Bucket not found' ? 'Storage bucket "cv-uploads" not found in Supabase.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !user.cv_file_path) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase.storage
        .from('cv-uploads')
        .remove([user.cv_file_path]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ cv_file_path: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser({ ...user, cv_file_path: null });
      toast.success('Resume deleted.');
    } catch (error) {
      console.error("Resume delete error:", error?.message || error?.error || error);
      toast.error(error?.message || 'Failed to delete resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/candidate/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-ink-muted hover:text-ink hover:bg-sage-100">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Resume / CV
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Keep your resume updated for recruiters and AI-assisted interviews
          </p>
        </div>
      </div>

      <Card className="bg-surface border-line shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-sage-700" />
            Resume Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user === undefined ? (
            <div className="h-44 bg-surface rounded-lg border border-line animate-pulse" />
          ) : user?.cv_file_path ? (
            <div className="space-y-6 py-2">
              <div className="flex items-center justify-between p-4 rounded-lg bg-sage-50 border border-line">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-sage-100 text-sage-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink flex items-center gap-1.5">
                      <span>Resume on file</span>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      PDF uploaded and ready for review
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-danger hover:bg-danger-soft hover:text-danger hover:border-danger/30 text-xs h-9"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Remove
                </Button>
              </div>

              <div className="text-xs text-ink-muted border-t border-line pt-4">
                To replace this document, remove the current file first or upload a new one.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 py-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-ink">
                  Upload PDF document
                </label>

                <div className="rounded-lg border border-dashed border-sage-300 hover:border-sage-700 transition-colors p-4 bg-sage-50/50">
                  <Dropzone
                    onDropAccepted={handleFileDrop}
                    accept={{ 'application/pdf': ['.pdf'] }}
                    maxFiles={1}
                  />
                </div>

                {uploadedFile && (
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-sage-100 border border-sage-200 text-xs text-ink">
                    <FileText className="w-4 h-4 text-sage-700 flex-shrink-0" />
                    <span className="font-medium truncate">{uploadedFile.name}</span>
                    <span className="text-ink-muted ml-auto font-mono text-[11px]">
                      {(uploadedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !uploadedFile}
                className="w-full h-10 text-xs font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading resume...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-1.5" />
                    Upload Resume
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
