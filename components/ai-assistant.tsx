"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .eq('chat_type', 'ai_assistant')
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        const formattedMessages: Message[] = (data || []).map((msg: {
          id: string;
          is_from_user: boolean;
          message: string;
          created_at: string;
        }) => ({
          id: msg.id,
          role: msg.is_from_user ? 'user' : 'assistant',
          content: msg.message,
          created_at: msg.created_at
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const saveMessage = async (content: string, isFromUser: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          chat_type: 'ai_assistant',
          message: content,
          is_from_user: isFromUser,
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Placeholder for AI integration
    // This would typically call OpenAI, Claude, or another AI service
    
    const responses = [
      "Welcome to Uwezo! I'm here to help with your onboarding questions. How can I assist you today?",
      "Great question! For document uploads, make sure your files are in PDF format and under 10MB.",
      "Your onboarding progress is looking good! Don't forget to complete all required tasks.",
      "I can help you with contract questions, document submissions, and general onboarding guidance.",
      "If you need help with the quiz section, I recommend reviewing the provided materials first.",
      "For technical issues, please check your internet connection and try refreshing the page.",
      "Your profile setup is important - make sure all required fields are completed.",
      "Feel free to ask me about deadlines, requirements, or any part of the onboarding process!"
    ];

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simple keyword-based responses (placeholder)
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('upload') || lowerMessage.includes('document')) {
      return "To upload documents, use the Document Upload section. Make sure your files are in PDF format and clearly named (e.g., 'John_Doe_CV.pdf'). The system will automatically analyze your CV to extract skills.";
    }
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
      return "The aptitude quiz is designed to assess your skills relevant to your role. Take your time, read each question carefully, and don't worry - you can retake it if needed!";
    }
    
    if (lowerMessage.includes('contract') || lowerMessage.includes('nda')) {
      return "For contracts and NDAs, please read through the documents carefully before signing. If you have questions about specific terms, feel free to ask your HR representative.";
    }
    
    if (lowerMessage.includes('progress') || lowerMessage.includes('complete')) {
      return "You can track your onboarding progress in the main dashboard. Each completed task will be marked with a green checkmark. Make sure to complete all required tasks to finish your onboarding.";
    }

    // Default response
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // Save user message
    await saveMessage(userMessage, true);

    try {
      // Get AI response
      const aiResponse = await getAIResponse(userMessage);

      // Add AI response
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);

      // Save AI message
      await saveMessage(aiResponse, false);

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  if (isLoadingMessages) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Ask me anything about your onboarding process
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Welcome! Ask me anything about your onboarding.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-12"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your onboarding..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}