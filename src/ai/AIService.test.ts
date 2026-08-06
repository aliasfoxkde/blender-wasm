import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from './AIService';

describe('AIService', () => {
  let service: AIService;

  beforeEach(() => {
    service = new AIService();
    vi.clearAllMocks();
  });

  describe('configure', () => {
    it('should set configuration', () => {
      service.configure({ provider: 'mock' });
      // No error means success
    });

    it('should merge with existing config', () => {
      service.configure({ provider: 'mock' });
      service.configure({ apiKey: 'test-key' });
      // Should not throw
    });
  });

  describe('processCommand', () => {
    it('should return mock response for mock provider', async () => {
      service.configure({ provider: 'mock' });
      const response = await service.processCommand({
        id: 'test',
        prompt: 'test command',
      });
      expect(response).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });

    it('should return error for unknown provider', async () => {
      service.configure({ provider: 'unknown' as any });
      const response = await service.processCommand({
        id: 'test',
        prompt: 'test',
      });
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown AI provider');
    });
  });

  describe('understand', () => {
    it('should create command from prompt', async () => {
      const command = await service.understand('add a cube');
      expect(command).toBeDefined();
      expect(command.id).toBeDefined();
      expect(command.prompt).toBe('add a cube');
    });
  });

  describe('streamCommand', () => {
    it('should be async generator', async () => {
      service.configure({ provider: 'mock' });
      const generator = service.streamCommand({ id: 'test', prompt: 'test' });
      expect(generator[Symbol.asyncIterator]).toBeDefined();
    });
  });
});
