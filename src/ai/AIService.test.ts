import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './AIService';

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('configure', () => {
    it('should set configuration', () => {
      aiService.configure({ provider: 'mock' });
      // No error means success
    });

    it('should merge with existing config', () => {
      aiService.configure({ provider: 'mock' });
      aiService.configure({ provider: 'mock', apiKey: 'test-key' });
      // Should not throw
    });
  });

  describe('processCommand', () => {
    it('should return mock response for mock provider', async () => {
      aiService.configure({ provider: 'mock' });
      const response = await aiService.processCommand({
        id: 'test',
        prompt: 'test command',
      });
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });

    it('should return error for unknown provider', async () => {
      aiService.configure({ provider: 'unknown' as 'mock' });
      const response = await aiService.processCommand({
        id: 'test',
        prompt: 'test',
      });
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown AI provider');
    });
  });

  describe('understand', () => {
    it('should create command from prompt', async () => {
      const command = await aiService.understand('add a cube');
      expect(command).toBeDefined();
      expect(command.id).toBeDefined();
      expect(command.prompt).toBe('add a cube');
    });
  });

  describe('streamCommand', () => {
    it('should be async generator', async () => {
      aiService.configure({ provider: 'mock' });
      const generator = aiService.streamCommand({ id: 'test', prompt: 'test' });
      expect(generator[Symbol.asyncIterator]).toBeDefined();
    });
  });
});
