"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Trash2, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { ChatMessage, useWeaveyChat } from "@/hooks/useWeaveyChat";
import { usePathname } from "next/navigation";

interface WeaveyChatProps {
  variant?: "landing" | "dashboard";
}

const WeaveyChat: React.FC<WeaveyChatProps> = ({ variant = "landing" }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(variant === "landing");
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, clearHistory } = useWeaveyChat({
    currentPage: pathname,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const welcomeMessage = user
    ? `Xin chào! Tôi là Weavey, trợ lý AI của WeaveCarbon. Tôi có thể giúp bạn:
    
• **Hướng dẫn Dashboard**: Điều hướng và sử dụng các tính năng
• **Nhập liệu thông minh**: Mô tả dữ liệu bằng ngôn ngữ tự nhiên
• **Cảnh báo tuân thủ**: Theo dõi và tối ưu hóa phát thải carbon

Bạn cần hỗ trợ gì?`
    : `Xin chào! Tôi là **Weavey** 🌱

Tôi là trợ lý AI bền vững của WeaveCarbon, sẵn sàng giúp bạn:

• Tìm hiểu về **carbon footprint** và cách tính toán
• Giải đáp thắc mắc về **quy định xuất khẩu xanh**
• Hướng dẫn sử dụng **công cụ tính toán carbon**

Hãy hỏi tôi bất cứ điều gì!`;

  // Landing page variant - larger chat widget
  if (variant === "landing") {
    return (
      <div className="fixed md:bottom-6 md:right-6 z-50">
        {isOpen ? (
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-95 h-130 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-linear-to-r from-primary to-accent p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Weavey</h3>
                  <p className="text-xs text-white/80">
                    AI Sustainability Assistant
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-70">
                      <div className="text-sm prose prose-sm dark:prose-invert">
                        <ReactMarkdown>{welcomeMessage}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat messages */}
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-linear-to-r from-primary to-accent hover:scale-110"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        )}
      </div>
    );
  }

  // Dashboard variant - compact floating button with expandable chat
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {isOpen ? (
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-90 h-80 md:h-120 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-linear-to-r from-primary to-accent p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Weavey</h3>
                <p className="text-xs text-white/80">AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={clearHistory}
                title="Xóa lịch sử"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 max-w-65">
                    <div className="text-sm prose prose-sm dark:prose-invert">
                      <ReactMarkdown>{welcomeMessage}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} compact />
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi Weavey..."
                className="flex-1 h-9 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9"
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-linear-to-r from-primary to-accent hover:scale-105 relative"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </Button>
      )}
    </div>
  );
};

// Message bubble component
const MessageBubble: React.FC<{ message: ChatMessage; compact?: boolean }> = ({
  message,
  compact,
}) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div
          className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center shrink-0",
            compact ? "w-7 h-7" : "w-8 h-8",
          )}
        >
          <Bot
            className={cn("text-primary", compact ? "w-3.5 h-3.5" : "w-4 h-4")}
          />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-3 py-2",
          compact ? "max-w-60" : "max-w-70",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm",
        )}
      >
        <div
          className={cn(
            "prose prose-sm dark:prose-invert",
            compact && "text-sm",
          )}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default WeaveyChat;
