"use client";

import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { MultimodalInput } from "@/components/multimodal-input";
import { Overview } from "@/components/overview";
import { TherapistMatchIndicator } from "@/components/therapist-match";
import { LocationCell } from "@/components/location-cell";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ToolInvocation } from "ai";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { useMemo } from "react";

export function Chat() {
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
    maxSteps: 4,
    onError: (error) => {
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
        .filter((tool: ToolInvocation) => tool.toolName === "get_therapist_match_amount" && tool.state === "result")
        .reverse(); // Get the most recent one
      
      if (therapistMatches.length > 0) {
        const result = therapistMatches[0].result as any;
        return {
          matchCount: result?.match_count,
          attributeIds: result?.filters_applied || []
        };
      }
    }
    return { matchCount: undefined, attributeIds: [] };
  }, [messages]);

  return (
    <div className="flex flex-col min-w-0 h-[calc(100dvh-52px)] bg-background">
      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
      >
        {messages.length === 0 && <Overview />}

        {messages.map((message, index) => (
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

      <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl relative">
        {/* Top bar with matches on left and location on right */}
        <div className="absolute bottom-full left-0 right-0 mb-2 z-10 flex items-center justify-between px-6">
          <div className="flex items-center">
            <TherapistMatchIndicator 
              matchCount={latestMatchData.matchCount} 
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
  );
}
