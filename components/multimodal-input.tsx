"use client"

import type { ChatRequestOptions, CreateMessage, Message } from "ai"
import type React from "react"
import { useRef, useEffect, useCallback, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"
import { useLocalStorage, useWindowSize } from "usehooks-ts"
import { cn, sanitizeUIMessages } from "@/lib/utils"
import { CornerRightUp, Mic, Square } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  stop: () => void
  messages: Array<Message>
  setMessages: Dispatch<SetStateAction<Array<Message>>>
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>
  handleSubmit: (
    event?: {
      preventDefault?: () => void
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void
  className?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { width } = useWindowSize()
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const [localStorageInput, setLocalStorageInput] = useLocalStorage("input", "")

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value
      const finalValue = domValue || localStorageInput || ""
      setInput(finalValue)
      adjustHeight()
    }
  }, [])

  useEffect(() => {
    setLocalStorageInput(input)
  }, [input, setLocalStorageInput])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    adjustHeight()
  }

  const submitForm = useCallback(() => {
    if (!input.trim()) return
    handleSubmit(undefined, {})
    setLocalStorageInput("")
    if (width && width > 768) {
      textareaRef.current?.focus()
    }
  }, [handleSubmit, setLocalStorageInput, width, input])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        // Here you would typically send the audio to your speech-to-text service
        // For now, we'll just show a placeholder message
        setInput("Audio recorded (speech-to-text integration needed)")
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      toast.error("Could not access microphone")
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={input}
          onChange={handleInput}
          className={cn(
            "min-h-[52px] max-h-[120px] overflow-hidden resize-none",
            "rounded-3xl pl-6 pr-20 py-4",
            "bg-muted/50 border-0",
            "focus-visible:ring-1 focus-visible:ring-primary/20",
            "placeholder:text-muted-foreground/60",
            "text-base leading-relaxed",
            "transition-all duration-200",
          )}
          rows={1}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              if (isLoading) {
                toast.error("Please wait for the model to finish its response!")
              } else {
                submitForm()
              }
            }
          }}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Mic Button - always visible, but changes based on recording state */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-xl p-0",
              "hover:bg-muted transition-all duration-200",
              isRecording && "bg-destructive/10 text-destructive hover:bg-destructive/20",
              input.trim() && !isRecording && "opacity-60",
            )}
            onClick={handleMicClick}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Submit Button - only visible when there's text and not recording */}
          {input.trim() && !isRecording && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 rounded-xl p-0",
                "hover:bg-primary/10 text-primary",
                "transition-all duration-200",
                "animate-in slide-in-from-right-2",
              )}
              onClick={submitForm}
              disabled={isLoading}
            >
              <CornerRightUp className="h-4 w-4" />
            </Button>
          )}

          {/* Loading/Stop Button */}
          {isLoading && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 rounded-xl p-0",
                "hover:bg-destructive/10 text-destructive",
                "transition-all duration-200",
              )}
              onClick={(event) => {
                event.preventDefault()
                stop()
                setMessages((messages) => sanitizeUIMessages(messages))
              }}
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-1 rounded-full border border-destructive/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Recording...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
