import { useEffect, useState, useRef } from "react";
import { useAgent } from "agents-sdk/react";
import { useAgentChat } from "agents-sdk/ai-react";
import { type Message } from "@ai-sdk/react";
import { APPROVAL } from "./shared";
import type { tools } from "./tools";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Switch } from "./components/ui/switch";
import { ArrowLeft, Send, Bot, Trash2, Sun, Moon, Bug } from "lucide-react";

// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof typeof tools)[] = [
  "getWeatherInformation",
];

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const agent = useAgent({
    agent: "chat",
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    addToolResult,
    clearHistory,
  } = useAgentChat({
    agent,
    maxSteps: 5,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const pendingToolCallConfirmation = messages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        toolsRequiringConfirmation.includes(
          part.toolInvocation.toolName as keyof typeof tools
        )
    )
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-background min-h-[100vh] mx-auto max-w-lg">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-background sticky top-0 z-10">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-400 text-white">AI</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-semibold text-base">AI Chat Demo</h2>
        </div>

        <div className="flex items-center gap-2 mr-2">
          <Bug className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={showDebug}
            onCheckedChange={setShowDebug}
            aria-label="Toggle debug mode"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={clearHistory}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <Card className="bg-secondary/30 border-secondary/50 p-6 max-w-md mx-auto">
              <div className="text-center space-y-4">
                <div className="bg-primary/10 text-primary rounded-full p-3 inline-flex">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">Welcome to AI Chat</h3>
                <p className="text-muted-foreground text-sm">
                  Start a conversation with your AI assistant. Try asking about:
                </p>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    <span>Weather information for any city</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    <span>Local time in different locations</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        )}

        {messages.map((m: Message, index) => {
          const isUser = m.role === "user";
          const showAvatar =
            index === 0 || messages[index - 1]?.role !== m.role;
          const showRole = showAvatar && !isUser;

          return (
            <div key={m.id}>
              {showDebug && (
                <pre className="text-xs text-muted-foreground overflow-scroll">
                  {JSON.stringify(m, null, 2)}
                </pre>
              )}
              <div
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {showAvatar && !isUser ? (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  ) : (
                    !isUser && <div className="w-8"></div>
                  )}

                  <div>
                    {showRole && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-medium capitalize">
                          {m.role}
                        </p>
                        <div className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          <span>AI</span>
                        </div>
                      </div>
                    )}

                    <div>
                      {m.parts?.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <div key={i}>
                              <Card
                                className={`p-3 rounded-2xl ${
                                  isUser
                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                    : "rounded-bl-none"
                                } ${
                                  part.text.startsWith("scheduled message")
                                    ? "border-accent/50"
                                    : ""
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">
                                  {part.text.replace(
                                    /^scheduled message: /,
                                    ""
                                  )}
                                </p>
                              </Card>
                              <p
                                className={`text-xs text-muted-foreground mt-1 ${
                                  isUser ? "text-right" : "text-left"
                                }`}
                              >
                                {formatTime(new Date())}
                              </p>
                            </div>
                          );
                        }

                        if (part.type === "tool-invocation") {
                          const toolInvocation = part.toolInvocation;
                          const toolCallId = toolInvocation.toolCallId;

                          if (
                            toolsRequiringConfirmation.includes(
                              toolInvocation.toolName as keyof typeof tools
                            ) &&
                            toolInvocation.state === "call"
                          ) {
                            return (
                              <Card
                                key={i}
                                className="p-4 my-3 bg-secondary/30 border-secondary/50 rounded-xl"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-primary/10 p-1.5 rounded-full">
                                    <Bot className="h-4 w-4 text-primary" />
                                  </div>
                                  <h4 className="font-medium">
                                    {toolInvocation.toolName}
                                  </h4>
                                </div>

                                <div className="mb-3">
                                  <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                                    Arguments:
                                  </h5>
                                  <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto">
                                    {JSON.stringify(
                                      toolInvocation.args,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>

                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      addToolResult({
                                        toolCallId,
                                        result: APPROVAL.NO,
                                      })
                                    }
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                      addToolResult({
                                        toolCallId,
                                        result: APPROVAL.YES,
                                      })
                                    }
                                  >
                                    Approve
                                  </Button>
                                </div>
                              </Card>
                            );
                          } else {
                            return null;
                            // return (
                            //   <Card
                            //     key={i}
                            //     className="p-3 rounded-2xl bg-secondary border-secondary"
                            //   >
                            //     <pre className="text-xs">
                            //       {JSON.stringify(toolInvocation, null, 2)}
                            //     </pre>
                            //   </Card>
                            // );
                          }
                        }
                        return null;
                        // return (
                        //   <div key={i}>
                        //     <Card className="p-3 rounded-2xl bg-secondary border-secondary">
                        //       <pre className="text-xs">
                        //         {JSON.stringify(part, null, 2)}
                        //       </pre>
                        //     </Card>
                        //   </div>
                        // );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) =>
          handleSubmit(e, {
            data: {
              annotations: {
                hello: "world",
              },
            },
          })
        }
        className="p-3 bg-muted bottom-0 sticky z-10 rounded-t-2xl"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              disabled={pendingToolCallConfirmation}
              placeholder={
                pendingToolCallConfirmation
                  ? "Please respond to the tool confirmation above..."
                  : "Type your message..."
              }
              className="pr-10 py-6 rounded-full bg-muted border-muted"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
          </div>

          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
            disabled={pendingToolCallConfirmation || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
