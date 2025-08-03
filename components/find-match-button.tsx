"use client";

import { toast } from "sonner";
import { Message } from "ai";
import { useState } from "react";

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
}

export function FindMatchButton({ messages, attributeIds }: FindMatchButtonProps) {
  const [matchResults, setMatchResults] = useState<MatchRankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (attributeIds.length === 0) {
    return null;
  }

  const handleFindMatch = async () => {
    setIsLoading(true);
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
      
      setMatchResults(data);
      toast.success(`Found your top ${data.profiles.length} therapist matches!`);
      
      console.log('Match ranking results:', data);
    } catch (error) {
      console.error('Error calling match-ranking endpoint:', error);
      toast.error('Failed to process match request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
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
      
      {matchResults && (
        <TherapistResults 
          results={matchResults} 
          onClose={() => setMatchResults(null)} 
        />
      )}
    </>
  );
}

function TherapistResults({ 
  results, 
  onClose 
}: { 
  results: MatchRankingResponse; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Top 3 Therapist Matches
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {results.profiles.map((profile, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-pink-100 text-pink-600 rounded-full font-semibold text-sm">
                      #{profile.aiRank}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profile.listingName}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {profile.healthRole}
                    {profile.healthRoleWriteIn && ` • ${profile.healthRoleWriteIn}`}
                  </p>
                </div>
                {profile.canonicalUrl && (
                  <a
                    href={profile.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-md hover:bg-pink-100 transition-colors"
                  >
                    View Profile
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Why this therapist is recommended:</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {profile.aiDescription}
                </p>
              </div>
              
              {profile.personalStatement && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Personal Statement:</h4>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                    {profile.personalStatement}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Rankings and descriptions powered by AI analysis
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}