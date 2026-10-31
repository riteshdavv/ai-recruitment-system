'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@/app/provider';
import { supabase } from '@/services/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Camera, Save, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function CandidateProfile() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullname: '',
    email: '',
    picture: null
  });
  const [originalData, setOriginalData] = useState({});
  const [password, setPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  let provider = null;
  if (typeof window !== 'undefined') {
    try {
      provider = JSON.parse(localStorage.getItem('sb-oqaqnjpovruuqpuohjbp-auth-token'))?.user?.app_metadata?.provider;
    } catch {}
  }
  const isGoogleUser = provider === 'google';

  useEffect(() => {
    if (user) {
      loadProfileData();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      let userData = {
        fullname: user?.name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        picture: user?.picture || null
      };

      if (user?.email) {
        const { data: userRecord, error } = await supabase
          .from('users')
          .select('name, email, picture')
          .eq('email', user.email)
          .single();

        if (!error && userRecord) {
          userData = {
            ...userData,
            fullname: userRecord.name || userData.fullname,
            email: userRecord.email || userData.email,
            picture: userRecord.picture || userData.picture
          };
        }
      }

      setProfileData(userData);
      setOriginalData(userData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.email}_${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ picture: publicUrl })
        .eq('email', user.email);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, picture: publicUrl }));
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading picture:', error);
      toast.error('Failed to upload picture');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.fullname,
          picture: profileData.picture
        })
        .eq('email', user.email);

      if (error) throw error;

      setOriginalData(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!password) return;
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error('Failed to change password');
      } else {
        toast.success('Password changed successfully');
        setPassword("");
      }
    } catch (e) {
      toast.error('Error changing password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(profileData) !== JSON.stringify(originalData);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-surface rounded w-48 border border-line" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-72 bg-surface rounded-lg border border-line" />
          <div className="h-72 bg-surface rounded-lg border border-line" />
        </div>
      </div>
    );
  }

  const initials = profileData.fullname
    ? profileData.fullname
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Candidate Profile
        </h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Manage your personal details and account settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Picture Section */}
        <Card className="bg-surface border-line shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <Camera className="w-4 h-4 text-sage-700" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4 py-2">
              <Avatar className="w-24 h-24 border border-line">
                <AvatarImage src={profileData.picture} alt="Profile" />
                <AvatarFallback className="text-xl font-semibold bg-sage-200 text-sage-900">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col items-center space-y-2">
                <Label htmlFor="picture-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild className="h-9 text-xs">
                    <span>
                      <Camera className="w-3.5 h-3.5 mr-1.5" />
                      Change photo
                    </span>
                  </Button>
                </Label>
                <input
                  id="picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                />
                {saving && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Section */}
        <Card className="bg-surface border-line shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <User className="w-4 h-4 text-sage-700" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullname" className="text-xs font-medium text-ink">
                  Full Name
                </Label>
                <Input
                  id="fullname"
                  value={profileData.fullname}
                  onChange={(e) => handleInputChange('fullname', e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-xs font-medium text-ink">
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={profileData.email}
                  placeholder="Enter your email"
                  type="email"
                  disabled
                  className="mt-1 bg-sage-50 text-ink-muted cursor-not-allowed"
                />
                <p className="text-[11px] text-ink-subtle mt-1">
                  Email address is linked to your login provider
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              className="w-full h-10 text-xs font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="bg-surface border-line shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <Shield className="w-4 h-4 text-sage-700" />
              Security & Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-xs font-medium text-ink">
                Change Password
              </Label>
              <Input
                id="password"
                type="password"
                value={isGoogleUser ? 'Managed by Google OAuth' : password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isGoogleUser ? '' : 'Enter new password'}
                disabled={isGoogleUser || passwordSaving}
                className="mt-1"
              />
              {isGoogleUser && (
                <p className="text-[11px] text-ink-muted mt-1">
                  You signed in with Google OAuth. Password changes are handled by your Google account.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordChange}
              disabled={isGoogleUser || !password || passwordSaving}
              className="w-full h-10 text-xs font-medium"
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="bg-surface border-line shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <Mail className="w-4 h-4 text-sage-700" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-1">
              <div className="flex justify-between items-center text-sm border-b border-line pb-2.5">
                <span className="text-ink-muted">Account role</span>
                <span className="font-medium text-ink">Candidate</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-muted">Member since</span>
                <span className="font-mono text-ink tabular-nums text-xs">
                  {user?.created_at ? 
                    new Date(user.created_at).toLocaleDateString() : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
