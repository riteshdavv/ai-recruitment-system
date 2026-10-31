"use client";

import { useState } from "react";
import { ArrowLeft, Coins, Check, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@/app/provider";

const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 10,
    price: 29,
    pricePerCredit: 2.9,
    popular: false,
    features: [
      "10 Interview Credits",
      "Perfect for small teams",
      "Valid for 6 months",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional Pack",
    credits: 25,
    price: 59,
    pricePerCredit: 2.36,
    popular: true,
    features: [
      "25 Interview Credits",
      "Best value for growing teams",
      "Valid for 12 months",
      "Priority email support",
      "Bulk interview creation",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 50,
    price: 99,
    pricePerCredit: 1.98,
    popular: false,
    features: [
      "50 Interview Credits",
      "Best price per interview",
      "Valid for 12 months",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
    ],
  },
];

export default function Billing() {
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, updateUserCredits } = useUser();

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const currentCredits = user?.credits || 0;
      const newCredits = currentCredits + selectedPackage.credits;

      const result = await updateUserCredits(newCredits);

      if (result.success) {
        toast.success(
          `Successfully added ${selectedPackage.credits} credits! New balance: ${newCredits} credits.`
        );

        setTimeout(() => {
          router.push("/recruiter/dashboard");
        }, 1500);
      } else {
        toast.error("Failed to update credits. Please try again.");
        console.error("Credit update error:", result.error);
      }
    } catch (error) {
      toast.error("Purchase failed. Please try again.");
      console.error("Purchase error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-sage-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 text-ink-muted hover:text-ink hover:bg-sage-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Purchase Credits
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Add credits to generate interview questions and conduct voice-based AI interviews.
            </p>
          </div>
        </div>

        {/* Current Balance Card */}
        {user && (
          <div className="flex justify-center">
            <div className="bg-surface rounded-xl shadow-card border border-line px-8 py-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sage-100 text-sage-700">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider font-medium text-ink-muted">
                  Current Balance
                </div>
                <div className="text-3xl font-mono font-semibold text-ink tabular-nums">
                  {user.credits || 0}
                  <span className="text-sm font-sans font-normal text-ink-muted ml-2">
                    credits available
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CREDIT_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative bg-surface rounded-xl border p-6 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "ring-2 ring-sage-700 border-sage-700 shadow-pop"
                    : "border-line shadow-card hover:border-sage-300"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sage-700 text-white text-xs font-medium px-3 py-0.5 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-semibold text-ink">
                      {pkg.name}
                    </span>
                    <div className="h-8 w-8 rounded-md bg-sage-100 text-sage-700 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold font-mono tracking-tight text-ink tabular-nums">
                        ${pkg.price}
                      </span>
                      <span className="text-xs text-ink-muted">/pack</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 font-mono">
                      ${pkg.pricePerCredit.toFixed(2)} per credit
                    </p>
                  </div>

                  <div className="border-t border-line pt-4 mb-6">
                    <ul className="space-y-2.5">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                          <Check className="w-4 h-4 text-sage-700 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <div
                    className={`w-full py-2 px-3 rounded-md text-xs font-medium text-center transition-colors ${
                      isSelected
                        ? "bg-sage-700 text-white"
                        : "bg-sage-100 text-sage-900 group-hover:bg-sage-200"
                    }`}
                  >
                    {pkg.credits} Interview Credits
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Purchase Summary Card */}
        <div className="max-w-md mx-auto bg-surface rounded-xl shadow-card border border-line overflow-hidden">
          <div className="px-6 py-4 border-b border-line bg-sage-50/50">
            <h2 className="text-sm font-semibold text-ink">
              Purchase Summary
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-muted">Selected package</span>
              <span className="font-medium text-ink">
                {selectedPackage.name}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-muted">Credits included</span>
              <span className="font-mono font-medium text-ink tabular-nums">
                {selectedPackage.credits} credits
              </span>
            </div>

            <div className="pt-3 border-t border-line flex justify-between items-center">
              <span className="text-sm font-semibold text-ink">Total amount</span>
              <span className="text-xl font-mono font-semibold text-sage-700 tabular-nums">
                ${selectedPackage.price}
              </span>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full mt-4 h-11 text-sm font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                `Purchase ${selectedPackage.credits} Credits`
              )}
            </Button>

            <p className="text-xs text-ink-subtle text-center pt-2">
              Instant activation · Safe checkout · Demo mode enabled
            </p>
          </div>
        </div>

        {/* How Credits Work */}
        <div className="pt-6 border-t border-line max-w-3xl mx-auto">
          <h2 className="text-sm font-semibold text-ink mb-6 text-center uppercase tracking-wider">
            How Credits Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-surface border border-line">
              <div className="w-10 h-10 bg-sage-100 text-sage-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-ink mb-1">1 Credit = 1 Interview</h3>
              <p className="text-xs text-ink-muted">
                Each job role or interview pipeline created consumes 1 credit.
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-surface border border-line">
              <div className="w-10 h-10 bg-sage-100 text-sage-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-ink mb-1">Unlimited Candidates</h3>
              <p className="text-xs text-ink-muted">
                Share the interview link with as many applicants as needed.
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-surface border border-line">
              <div className="w-10 h-10 bg-sage-100 text-sage-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-ink mb-1">12-Month Validity</h3>
              <p className="text-xs text-ink-muted">
                Purchased credits remain available in your account for 12 months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
