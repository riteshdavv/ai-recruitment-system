import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { Toaster } from "sonner";
import { AuthContextProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Recruitment Agent — Intelligent Voice Interviews",
  description: "Automated voice-based AI interviews for streamlined hiring",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-ink bg-sage-50 min-h-screen selection:bg-sage-200 selection:text-sage-900">
        <Provider>
          <AuthContextProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </AuthContextProvider>
        </Provider>
      </body>
    </html>
  );
}
