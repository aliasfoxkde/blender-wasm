/**
 * AI Service - Connects AI Gateway to various providers
 */

import { aiGateway, type AICommand, type AIResponse } from './AIGateway';

export type AIProvider = 'openai' | 'anthropic' | 'local' | 'mock';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

class AIService {
  private config: AIProviderConfig = { provider: 'mock' };

  configure(config: AIProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  async processCommand(command: AICommand): Promise<AIResponse> {
    switch (this.config.provider) {
      case 'mock':
        return this.processMock(command);

      case 'local':
        return this.processLocal(command);

      case 'openai':
        return this.processOpenAI(command);

      case 'anthropic':
        return this.processAnthropic(command);

      default:
        return { success: false, error: 'Unknown AI provider' };
    }
  }

  private async processMock(command: AICommand): Promise<AIResponse> {
    const prompt = command.prompt.toLowerCase();

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Parse common commands
    if (prompt.includes('add cube')) {
      const obj = await aiGateway.getSceneGraph().addObject('mesh', {
        name: 'Cube',
        type: 'mesh',
        children: [],
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        visible: true,
        locked: false,
      });
      return { success: !!obj, result: obj };
    }

    if (prompt.includes('add sphere')) {
      const obj = await aiGateway.getSceneGraph().addObject('mesh', {
        name: 'Sphere',
        type: 'mesh',
        children: [],
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        visible: true,
        locked: false,
      });
      return { success: !!obj, result: obj };
    }

    if (prompt.includes('render')) {
      return { success: true, result: 'Render started' };
    }

    if (prompt.includes('scene')) {
      const scene = await aiGateway.getSceneGraph().getScene();
      return { success: true, result: scene };
    }

    return { success: true, result: `Processed: ${command.prompt}` };
  }

  private async processLocal(command: AICommand): Promise<AIResponse> {
    // Use local LLM via WebLLM or similar
    // For now, fall back to mock
    return this.processMock(command);
  }

  private async processOpenAI(command: AICommand): Promise<AIResponse> {
    if (!this.config.apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    try {
      // In production, this would call OpenAI API
      // For now, use mock
      return this.processMock(command);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OpenAI API error',
      };
    }
  }

  private async processAnthropic(command: AICommand): Promise<AIResponse> {
    if (!this.config.apiKey) {
      return { success: false, error: 'Anthropic API key not configured' };
    }

    try {
      // In production, this would call Anthropic API
      // For now, use mock
      return this.processMock(command);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Anthropic API error',
      };
    }
  }

  // Convert natural language to structured command
  async understand(prompt: string): Promise<AICommand> {
    // Use AI to parse natural language into structured commands
    // For now, just create a basic command
    return {
      id: crypto.randomUUID(),
      prompt,
    };
  }

  // Stream response for UI feedback
  async *streamCommand(command: AICommand): AsyncGenerator<string, AIResponse, void> {
    const response = await this.processCommand(command);
    yield JSON.stringify(response);
    return response;
  }
}

export const aiService = new AIService();
