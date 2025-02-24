import { createOpenAI } from "@ai-sdk/openai";
import {
  createDataStreamResponse,
  type Message,
  streamText,
  type StreamTextOnFinishCallback,
} from "ai";
import { processToolCalls } from "./utils";
import { tools, executions } from "./tools";
import {
  type AgentNamespace,
  type Connection,
  routeAgentRequest,
} from "@cloudflare/agents";
import { AIChatAgent } from "@cloudflare/agents/ai-chat-agent";

// Environment variables type definition
type Env = {
  OPENAI_API_KEY: string;
  Chat: AgentNamespace<Chat>;
};

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   * @param connection - WebSocket connection instance
   * @param messages - Array of chat messages in the conversation
   * @param onFinish - Callback function executed when streaming completes
   */
  async onChatMessage(
    connection: Connection,
    messages: Message[],
    onFinish: StreamTextOnFinishCallback<any>
  ) {
    // Create a streaming response that handles both text and tool outputs
    const dataStreamResponse = createDataStreamResponse({
      execute: async (dataStream) => {
        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages,
          dataStream,
          tools,
          executions,
        });

        // Initialize OpenAI client with API key from environment
        const openai = createOpenAI({
          apiKey: this.env.OPENAI_API_KEY,
        });

        // Stream the AI response using GPT-4
        const result = streamText({
          model: openai("gpt-4o"),
          messages: processedMessages,
          tools,
          onFinish,
        });

        // Merge the AI response stream with tool execution outputs
        result.mergeIntoDataStream(dataStream);
      },
    });

    return dataStreamResponse;
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
