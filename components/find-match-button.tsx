"use client";

import { toast } from "sonner";
import { Message } from "ai";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TherapistProfile {
  listingName: string;
  healthRole: string;
  healthRoleWriteIn?: string;
  personalStatement: string;
  aiRank: number;
  aiDescription: string;
  canonicalUrl?: string;
}

interface MatchRankingResponse {
  profiles: TherapistProfile[];
  aiAnalysis: {
    rankedMatches: Array<{
      originalId: number;
      rank: number;
      description: string;
    }>;
  };
}

interface FindMatchButtonProps {
  messages: Message[];
  attributeIds: number[];
  matchCount: number;
}

export function FindMatchButton({ matchCount, messages, attributeIds }: FindMatchButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();

  if (attributeIds.length === 0) {
    return null;
  }


  const handleFindMatch = async () => {
    
    if (matchCount > 500) {
      setShowDialog(true);
      return;
    }
    
    // Proceed directly for <= 500 matches
    await processMatchRequest();
  };

  const processMatchRequest = async () => {
    setIsLoading(true);
    setShowDialog(false);
    
    try {
      const response = await fetch('/api/match-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to call match-ranking endpoint');
      }
      
      const data: MatchRankingResponse = await response.json();
      
      // Check if there was an error in the response
      if (data.aiAnalysis && 'error' in data.aiAnalysis) {
        throw new Error(`API error: ${data.aiAnalysis.error}`);
      }
      
      if (!data.profiles || data.profiles.length === 0) {
        throw new Error('No therapist profiles were returned');
      }
      
      // Store results in localStorage and navigate to results page
      localStorage.setItem('therapistMatchResults', JSON.stringify(data));
      toast.success(`Found your top ${data.profiles.length} therapist matches!`);
      
      console.log('Match ranking results:', data);
      
      // Navigate to results page
      router.push('/matches');
      
    } catch (error) {
      console.error('Error calling match-ranking endpoint:', error);
      toast.error('Failed to process match request');
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleFindMatch}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 h-7 px-2.5 text-xs font-medium rounded-md border transition-all duration-200
          text-pink-500 border-pink-300/30 bg-transparent hover:border-pink-400/60 hover:text-pink-600 
          hover:bg-pink-50/50 hover:shadow-pink-200/50 hover:shadow-md
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-400
          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          textShadow: '0 0 8px rgba(236, 72, 153, 0.3)',
        }}
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border border-pink-400 border-t-transparent rounded-full animate-spin" />
            Finding...
          </>
        ) : (
          'Find Match'
        )}
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>High Match Count</DialogTitle>
            <DialogDescription>
              You have {matchCount.toLocaleString()} potential matches. While we can proceed with finding your best matches, 
              refining your profile with more specific preferences might yield better, more personalized results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setShowDialog(false)}
            >
              Back
            </Button>
            <Button 
              type="button"
              onClick={processMatchRequest}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 mr-2 border border-white border-t-transparent rounded-full animate-spin" />
                  Finding...
                </>
              ) : (
                'Continue Anyway'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}