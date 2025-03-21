import { ChatMessage } from "@/lib/gemini";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { LucideLoader2 } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessage;
  isLoading?: boolean;
}

export function PlantChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-10 w-10">
        {isUser ? (
          <>
            <AvatarFallback>U</AvatarFallback>
            <AvatarImage src="/user-avatar.png" alt="User" />
          </>
        ) : (
          <>
            <AvatarFallback className="bg-green-600 text-white">🌱</AvatarFallback>
            <AvatarImage src="/plant-avatar.png" alt="Plant Assistant" />
          </>
        )}
      </Avatar>
      
      <Card className={`p-4 max-w-[80%] ${isUser ? 'bg-primary/10 dark:bg-primary/20' : 'bg-muted'}`}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <LucideLoader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Thinking...</span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </Card>
    </div>
  );
}