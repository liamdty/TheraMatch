"use client";

import { toast } from "sonner";
import { Message } from "ai";

interface FindMatchButtonProps {
  messages: Message[];
  attributeIds: number[];
}

export function FindMatchButton({ messages, attributeIds }: FindMatchButtonProps) {
  if (attributeIds.length === 0) {
    return null;
  }

  const handleFindMatch = async () => {
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to call match endpoint');
      }
      
      console.log('Match request sent successfully');
    } catch (error) {
      console.error('Error calling match endpoint:', error);
      toast.error('Failed to process match request');
    }
  };

  return (
    <button
      onClick={handleFindMatch}
      className="inline-flex items-center justify-center gap-2 h-7 px-2.5 text-xs font-medium rounded-md border transition-all duration-200
        text-pink-500 border-pink-300/30 bg-transparent hover:border-pink-400/60 hover:text-pink-600 
        hover:bg-pink-50/50 hover:shadow-pink-200/50 hover:shadow-md
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-400
        active:scale-95"
      style={{
        textShadow: '0 0 8px rgba(236, 72, 153, 0.3)',
      }}
    >
      Find Match
    </button>
  );
}