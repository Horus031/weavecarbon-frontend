import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatConversation {
  id: string;
  userId: string | null;
  sessionId: string;
  messages: ChatMessage[];
  updatedAt: Date;
}

interface UseWeaveyChatOptions {
  currentPage?: string;
  carbonData?: Record<string, unknown>;
}

// Custom API endpoint for WeaveCarbon AI
const WEAVEY_API_URL = process.env.NEXT_PUBLIC_WEAVEY_API_URL;

// Mock storage (keep existing)
const mockStorage = {
  conversations: [] as ChatConversation[],

  getConversations(userId: string | null, sessionId: string) {
    return this.conversations.filter(
      (c) => (userId && c.userId === userId) || c.sessionId === sessionId,
    );
  },

  getLatestConversation(userId: string | null, sessionId: string) {
    const conversations = this.getConversations(userId, sessionId);
    return conversations.length > 0
      ? conversations[conversations.length - 1]
      : null;
  },

  createConversation(
    userId: string | null,
    sessionId: string,
  ): ChatConversation {
    const conversation: ChatConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId,
      messages: [],
      updatedAt: new Date(),
    };
    this.conversations.push(conversation);
    this.syncToLocalStorage();
    return conversation;
  },

  addMessage(conversationId: string, message: ChatMessage): ChatMessage | null {
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) return null;

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    this.syncToLocalStorage();
    return message;
  },

  syncToLocalStorage() {
    try {
      localStorage.setItem(
        "weavey_conversations",
        JSON.stringify(this.conversations),
      );
    } catch (error) {
      console.error("Failed to sync to localStorage:", error);
    }
  },

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem("weavey_conversations") || null;
      if (data) {
        this.conversations = JSON.parse(data).map((c: ChatConversation) => ({
          ...c,
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: ChatMessage) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          })),
        }));
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  },

  deleteConversation(conversationId: string) {
    this.conversations = this.conversations.filter(
      (c) => c.id !== conversationId,
    );
    this.syncToLocalStorage();
  },
};

mockStorage.loadFromLocalStorage();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useWeaveyChat(_options: UseWeaveyChatOptions = {}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );

  useEffect(() => {
    const conversation = mockStorage.getLatestConversation(
      user?.id || null,
      sessionId,
    );
    if (conversation) {
      setConversationId(conversation.id);
      setMessages(conversation.messages);
    }
  }, [user?.id, sessionId]);

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: input,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        let convId = conversationId;
        if (!convId) {
          const newConversation = mockStorage.createConversation(
            user?.id || null,
            sessionId,
          );
          convId = newConversation.id;
          setConversationId(convId);
        }

        mockStorage.addMessage(convId, userMessage);

        // Call WeaveCarbon API
        const assistantContent = await getWeaveyResponse(input);

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        mockStorage.addMessage(convId, assistantMessage);
      } catch (error) {
        console.error("Weavey chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            role: "assistant",
            content:
              "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.",
            createdAt: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, conversationId, user?.id, sessionId],
  );

  const clearHistory = useCallback(() => {
    if (conversationId) {
      mockStorage.deleteConversation(conversationId);
      setMessages([]);
      setConversationId(null);
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
  };
}

// Custom API response handler
async function getWeaveyResponse(input: string): Promise<string> {
  if (!WEAVEY_API_URL) {
    throw new Error("WEAVEY_API_URL is not configured");
  }

  try {
    const response = await fetch(WEAVEY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", // Skip ngrok browser warning
      },
      body: JSON.stringify({
        columns_to_answer: ["cau hoi"],
        query: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the answer from the response
    if (data.answer) {
      return data.answer;
    }

    throw new Error("No answer in response");
  } catch (error) {
    console.error("WeaveCarbon API error:", error);
    throw new Error("Failed to get response from WeaveCarbon API");
  }
}
