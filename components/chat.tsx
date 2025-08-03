"use client";

import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { MultimodalInput } from "@/components/multimodal-input";
import { TherapistMatchIndicator } from "@/components/therapist-match";
import { LocationCell } from "@/components/location-cell";
import { FindMatchButton } from "@/components/find-match-button";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ToolInvocation } from "ai";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import { LogoGemini } from "@/app/icons";
import Image from "next/image";

// Therapy suggestions
const therapySuggestions = [
  "I'm struggling with anxiety",
  "Looking for couples counseling", 
  "Dealing with depression",
  "Need trauma therapy",
  "Want family therapy",
  "Looking for Spanish-speaking therapist",
  "Need addiction recovery help",
  "Want online therapy sessions",
  "Looking for LGBTQ+ friendly therapist",
  "Need grief counseling support"
];

// Client-only component for random suggestions
const RandomSuggestions = ({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const shuffled = [...therapySuggestions].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 5));
    
    // Add a small delay before showing to create fade-in effect
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  }, []);

  // Reserve space with invisible placeholders to prevent layout shift
  if (!isClient) {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-12 max-w-2xl mx-auto">
        {therapySuggestions.slice(0, 5).map((suggestion, index) => (
          <div
            key={`placeholder-${index}`}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full px-4 py-2 text-sm whitespace-nowrap opacity-0"
            style={{ visibility: 'hidden' }}
          >
            {suggestion}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-12 max-w-2xl mx-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          onClick={() => onSuggestionClick(suggestion)}
          className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full px-4 py-2 text-sm transition-all duration-500 ease-out whitespace-nowrap ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ 
            transitionDelay: `${index * 100}ms` 
          }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

const Chat = () => {
  const chatId = "001";

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
  } = useChat({
    maxSteps: 2,
    onError: (error: any) => {
      if (error.message.includes("Too many requests")) {
        toast.error(
          "You are sending too many messages. Please try again later.",
        );
      }
    },
  });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Extract the latest therapist match data from tool invocations
  const latestMatchData = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.toolInvocations) {
      const therapistMatches = lastMessage.toolInvocations
        .filter((tool: ToolInvocation) => tool.toolName === "get_therapist_match_data" && tool.state === "result")
        .reverse(); // Get the most recent one
      
      if (therapistMatches.length > 0) {
        const toolResult = therapistMatches[0] as any;
        const result = toolResult?.result;
        return {
          matchCount: result?.match_count,
          attributeIds: result?.filters_applied || []
        };
      }
    }
    return { matchCount: undefined, attributeIds: [] };
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    append({
      role: "user",
      content: suggestion,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden">
      {/* Gradient background effects */}
      <div className="flex gap-[5rem] rotate-[-20deg] absolute top-[-40rem] right-[-30rem] z-[0] blur-[4rem] skew-[-40deg] opacity-30">
        <div className="w-[10rem] h-[20rem] bg-background"></div>
        <div className="w-[10rem] h-[20rem] bg-background"></div>
      </div>
      <div className="flex gap-[5rem] rotate-[-20deg] absolute top-[-50rem] right-[-50rem] z-[0] blur-[4rem] skew-[-40deg] opacity-30">
        <div className="w-[10rem] h-[20rem] bg-background"></div>
        <div className="w-[10rem] h-[20rem] bg-background"></div>
      </div>
      <div className="flex gap-[5rem] rotate-[-20deg] absolute top-[-60rem] right-[-60rem] z-[0] blur-[4rem] skew-[-40deg] opacity-30">
        <div className="w-[10rem] h-[30rem] bg-background"></div>
        <div className="w-[10rem] h-[30rem] bg-background"></div>
      </div>

      {/* Header */}
      <header className="flex justify-between items-center p-6 relative z-10">
        <div className="flex items-center gap-1">
          <Image src="https://files.catbox.moe/xbfenx.svg" width={128} height={128}  className="w-14 h-14" alt="TheraMatch Logo" />
          <div className="font-bold text-lg text-dark">TheraMatch</div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Hero Section - shown when no messages */}
        {messages.length === 0 && (
          <main className="flex-1 flex flex-col items-center justify-center px-4 text-center min-h-0">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="bg-card border rounded-full px-4 py-2 flex items-center gap-2 w-fit mx-4">
                  <span className="text-xs flex items-center gap-1 text-muted-foreground">
                     <LogoGemini size={20}/> Powered by<span className="gemini-gradient">Gemini</span>
                  </span>
                </div>
              </div>
              
              {/* Headline */}
              <h1 className="text-5xl font-bold leading-tight text-foreground">
                Find The Best Therapist For You With TheraMatch
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-muted-foreground">
                Tell me what you&apos;re looking for and I&apos;ll help match you with qualified therapists in Toronto.
              </p>

              {/* Suggestion pills */}
              <RandomSuggestions onSuggestionClick={handleSuggestionClick} />
            </div>
          </main>
        )}

        {/* Chat Messages Area */}
        {messages.length > 0 && (
          <div
            ref={messagesContainerRef}
            className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 px-4"
          >
            {messages.map((message: any, index: number) => (
              <PreviewMessage
                key={message.id}
                chatId={chatId}
                message={message}
                isLoading={isLoading && messages.length - 1 === index}
              />
            ))}

            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && <ThinkingMessage />}

            <div
              ref={messagesEndRef}
              className="shrink-0 min-w-[24px] min-h-[24px]"
            />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative z-10">
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl relative">
          {/* Top bar with matches on left and location on right */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-full max-w-2xl flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <TherapistMatchIndicator 
                matchCount={latestMatchData.matchCount} 
                attributeIds={latestMatchData.attributeIds}
              />
              <FindMatchButton 
                matchCount={latestMatchData.matchCount}
                messages={messages}
                attributeIds={latestMatchData.attributeIds}
              />
            </div>
            <div className="flex items-center">
              <LocationCell />
            </div>
          </div>
          <MultimodalInput
            chatId={chatId}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        </form>
      </div>

      {/* Gemini gradient styles */}
      <style jsx>{`
        .gemini-gradient {
          position: relative;
          display: inline-block;
          color: transparent;
          background: linear-gradient(
            74deg,
            #4285f4 0%,
            #34a853 10%,
            #fbbc04 20%,
            #fbbc04 24%,
            #34a853 35%,
            #4285f4 44%,
            #34a853 50%,
            #fbbc04 56%,
            #ea4335 66%,  
            #ea4335 75%,
            #4285f4 100%
          );
          background-size: 400% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gemini-shimmer 3s ease-in-out infinite;
        }

        @keyframes gemini-shimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}
      </style>

    </div>
  );
};

export { Chat };