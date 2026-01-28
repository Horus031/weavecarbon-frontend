import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Initialize Gemini
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
);

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
      const data = localStorage.getItem("weavey_conversations");
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

export function useWeaveyChat(options: UseWeaveyChatOptions = {}) {
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

        // Call Gemini API
        const assistantContent = await getGeminiResponse(
          input,
          messages,
          options,
        );

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
    [isLoading, conversationId, messages, options, user?.id, sessionId],
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

// Gemini API response handler
async function getGeminiResponse(
  input: string,
  conversationHistory: ChatMessage[],
  options: UseWeaveyChatOptions,
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build conversation context
    const systemPrompt = `You are Weavey, an AI assistant for WeaveCarbon, a platform for tracking and reducing carbon footprint in the fashion industry.
You help users with:
- Carbon footprint calculation and tracking
- Export compliance requirements
- Sustainability recommendations
- Product lifecycle analysis
- Supply chain optimization

Current page: ${options.currentPage || "unknown"}
Language: Vietnamese (Vietnamese language preferred, but respond in user's language)

Be helpful, concise, and provide actionable advice.`;

    // Format chat history for Gemini
    const chatHistory = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start chat session
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send message and get response
    const result = await chat.sendMessage(systemPrompt + "\n\nUser: " + input);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to get response from Gemini API");
  }
}
