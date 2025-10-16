"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "buddy";
  timestamp: Date;
}

interface BuddyChatProps {
  className?: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hi! I'm your Uwezo Buddy! 👋 I'm here to help you navigate your onboarding journey. How can I assist you today?",
    sender: "buddy",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
];

const buddyResponses = [
  "I'm here to help! Let me know if you have any questions about the onboarding process.",
  "Great question! I'd suggest checking out the video introduction first to get familiar with our platform.",
  "You're doing great! Don't hesitate to reach out if you need clarification on any tasks.",
  "I'm always here to help you succeed! What specific area would you like assistance with?",
  "Feel free to explore the different sections of your dashboard. Each component is designed to guide you through your journey.",
  "Remember, there's no rush! Take your time to complete each step thoroughly.",
  "I notice you're working on your onboarding. Is there anything specific you'd like help with?",
  "That's a great approach! Breaking down tasks into smaller steps always makes things more manageable.",
  "I'm here 24/7 to support you. What would you like to focus on next?",
  "Excellent progress! Keep up the great work and remember I'm here if you need guidance.",
];

export function BuddyChat({ className }: BuddyChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBuddyResponse = () => {
    const responses = buddyResponses;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate buddy typing and response
    setTimeout(() => {
      const buddyMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBuddyResponse(),
        sender: "buddy",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, buddyMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageCircle className="h-4 w-4" />
          Uwezo Buddy
        </CardTitle>
        <CardDescription className="text-xs">
          Your AI assistant for onboarding support
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-80">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 pb-2">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "buddy" && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                    <p className={`text-[10px] mt-1 opacity-70`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 text-xs"
                disabled={isTyping}
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="px-3"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}