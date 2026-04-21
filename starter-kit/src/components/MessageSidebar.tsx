"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import {
  MessagingApiMessage,
  MessagingSender,
  MessagingThreadId,
} from "@/components/messaging/types";

type ChatMessage = {
  id: string;
  sender: MessagingSender;
  text: string;
  time: string;
  pending?: boolean;
};

type MessageSidebarProps = {
  initialThreadId?: MessagingThreadId;
  scanId?: string;
};

function formatMessage(apiMessage: MessagingApiMessage): ChatMessage {
  return {
    id: apiMessage.id,
    sender: apiMessage.sender,
    text: apiMessage.content,
    time: new Date(apiMessage.createdAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default function MessageSidebar({ initialThreadId, scanId }: MessageSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [threadId, setThreadId] = useState<MessagingThreadId | null>(initialThreadId ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = threadId ? `?threadId=${encodeURIComponent(threadId)}` : "";
      const response = await fetch(`/api/messaging${params}`, { method: "GET" });
      const payload = (await response.json()) as {
        threadId?: MessagingThreadId;
        messages?: MessagingApiMessage[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load messages.");
      }

      setThreadId(payload.threadId ?? null);
      setMessages((payload.messages ?? []).map(formatMessage));
    } catch (error) {
      console.error("Failed to load messages", error);
      setFetchError("Unable to load messages right now.");
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (isLoading || messages.length === 0 || !messageListRef.current) {
      return;
    }

    const behavior = hasScrolledRef.current ? "smooth" : "auto";
    messageListRef.current.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior,
    });
    hasScrolledRef.current = true;
  }, [messages, isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    setSendError(null);
    setIsSending(true);
    setDraft("");

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      sender: "patient",
      text,
      time: "Sending...",
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch("/api/messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          sender: "patient",
          content: text,
        }),
      });

      const payload = (await response.json()) as {
        threadId?: MessagingThreadId;
        message?: MessagingApiMessage;
        error?: string;
      };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error || "Unable to send message.");
      }

      setThreadId(payload.threadId ?? threadId);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === optimisticId ? formatMessage(payload.message) : message
        )
      );
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setDraft(text);
      setSendError("Message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const isDraftEmpty = draft.trim().length === 0;

  return (
    <aside
      className="rounded-2xl border border-zinc-800/80 bg-zinc-900/55 p-4 sm:p-5"
      aria-label="Messaging area"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Quick Message</h2>
        <span className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-100">
          Secure
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        {scanId
          ? `Message the clinic about this scan (${scanId.slice(0, 8)}...).`
          : "Chat quickly with your dentist about your latest scan."}
      </p>

      <div
        ref={messageListRef}
        className="mt-4 h-72 overflow-y-auto rounded-xl border border-zinc-700/80 bg-zinc-950/55 p-3 sm:h-[26rem]"
      >
        {isLoading ? (
          <div className="flex h-full min-h-48 items-center justify-center text-xs text-zinc-500">
            Loading conversation...
          </div>
        ) : fetchError ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-rose-400/20 bg-rose-500/5 px-4 text-center">
            <p className="text-xs text-rose-200">{fetchError}</p>
            <button
              type="button"
              onClick={loadMessages}
              className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed border-zinc-700/80 bg-zinc-900/30 px-4 text-center">
            <div>
              <p className="text-sm font-medium text-zinc-100">No messages yet</p>
              <p className="mt-1 text-xs text-zinc-400">
                Ask your dentist a quick question about your scan.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isPatient = message.sender === "patient";
              const senderLabel = isPatient ? "You" : "Dentist";
              const bubbleClass = isPatient
                ? "border-cyan-300/35 bg-cyan-500/15 text-cyan-50"
                : "border-zinc-700 bg-zinc-900/90 text-zinc-100";
              const metaClass = isPatient ? "text-cyan-100/70" : "text-zinc-500";

              return (
                <div
                  key={message.id}
                  className={`flex ${isPatient ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`w-fit max-w-[90%] rounded-2xl border px-3 py-2 text-sm sm:max-w-[85%] ${bubbleClass}`}
                  >
                    <p className={`mb-1 text-[10px] uppercase tracking-wide ${metaClass}`}>
                      {senderLabel}
                    </p>
                    <p>{message.text}</p>
                    <p className={`mt-1 text-[10px] ${metaClass}`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <label htmlFor="quick-message-input" className="sr-only">
          Message
        </label>
        <input
          id="quick-message-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isSending}
          placeholder="Type a quick message..."
          className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950/85 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={isLoading || isSending || isDraftEmpty}
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-3 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send size={15} />
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>

      {sendError ? <p className="mt-2 text-xs text-rose-300">{sendError}</p> : null}
    </aside>
  );
}
