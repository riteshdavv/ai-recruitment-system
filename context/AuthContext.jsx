"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [userProfile, setUserProfile] = useState(undefined);
  const router = useRouter();

  // Fetch initial session + subscribe to changes
  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data?.session || null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) {
          setSession(null);
        }
      }
    };
    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session || null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (email) => {
    console.log("Fetching profile for:", email);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
  
    console.log("Profile fetch result:", { data, error });
  
    if (!error) {
      setUserProfile(data);
    } else {
      console.error("Failed to fetch profile:", error);
    }
  };
  
  // Sign in
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });
  
      console.log("Supabase response:", { data, error });
  
      if (error) {
        return { success: false, error: error.message };
      }

      // Check if user is banned
      const { data: userData, error: profileError } = await supabase
        .from("users")
        .select("role, banned")
        .eq("email", email)
        .single();
  
      if (profileError || !userData) {
        toast.error("Could not fetch user profile.");
        return { success: false, error: "Profile not found." };
      }

      // Check if user is banned
      if (userData.banned) {
        await supabase.auth.signOut();
        return { success: false, error: "Your account has been banned. Please contact support for more information." };
      }
  
      // Optionally update global state:
      setUserProfile(userData);
  
      toast.success("Logged in!");
  
      if (userData.role === "recruiter") {
        window.location.href = "/recruiter/dashboard";
      } else if (userData.role === "candidate") {
        window.location.href = "/candidate/dashboard";
      }
  
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };
  
  // Sign up
  const signUpNewUser = async (email, password, { name, role }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });
  
      console.log("SIGNUP response:", authData, authError);
  
      if (authError || !authData?.user?.id) {
        return {
          success: false,
          error: authError?.message || "Signup failed. Please try again.",
        };
      }
  
      const { error: insertError } = await supabase.from("users").insert([
        {
          email: email.toLowerCase(),
          name,
          role,
          picture: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          credits: 3,
        },
      ]);
  
      if (insertError) {
        console.error("Insert error:", insertError);
        return { success: false, error: insertError.message };
      }
  
      return { success: true, user: authData.user };
    } catch (err) {
      console.error("Sign up exception:", err);
      return { success: false, error: "Unexpected error occurred." };
    }
  };
    
  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Sign out failed.");
      return;
    }

    setSession(null);
    setUserProfile(null);
    toast.success("Successfully signed out.");
    router.push("/login");
  };



  return (
    <AuthContext.Provider
      value={{
        session,
        userProfile,
        signInUser,
        signUpNewUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};