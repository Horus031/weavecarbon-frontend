import { useState, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface UseWeaveyChatOptions {
  currentPage?: string;
  carbonData?: Record<string, unknown>;
}


const WEAVEY_API_URL = process.env.NEXT_PUBLIC_WEAVEY_API_URL;


export function useWeaveyChat(_options: UseWeaveyChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: input,
        createdAt: new Date()
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {

        const assistantContent = await getWeaveyResponse(input);

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          createdAt: new Date()
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Weavey chat error:", error);
        setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: "assistant",
          content:
          "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.",
          createdAt: new Date()
        }]
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory
  };
}


async function getWeaveyResponse(input: string): Promise<string> {
  if (!WEAVEY_API_URL) {
    throw new Error("WEAVEY_API_URL is not configured");
  }

  try {
    const response = await fetch(WEAVEY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        columns_to_answer: ["cau hoi"],
        query: input
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();


    if (data.answer) {
      return data.answer;
    }

    throw new Error("No answer in response");
  } catch (error) {
    console.error("WeaveCarbon API error:", error);
    throw new Error("Failed to get response from WeaveCarbon API");
  }
}