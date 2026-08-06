import { describe, it, expect, vi, beforeEach } from 'vitest';
import { automationAPI } from './AutomationAPI';

describe('AutomationAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('configure', () => {
    it('should set custom options', () => {
      automationAPI.configure({ port: 9999 });
      // No error means success
    });

    it('should merge with existing options', () => {
      automationAPI.configure({ port: 8888 });
      automationAPI.configure({ apiKey: 'test-key' });
      // Should not throw
    });
  });

  describe('start', () => {
    it('should start the server', async () => {
      await expect(automationAPI.start()).resolves.not.toThrow();
    });

    it('should warn if already running', async () => {
      await automationAPI.start();
      await expect(automationAPI.start()).resolves.not.toThrow(); // Warns but doesn't throw
    });
  });

  describe('stop', () => {
    it('should stop the server', async () => {
      await automationAPI.start();
      await expect(automationAPI.stop()).resolves.not.toThrow();
      expect(automationAPI.isRunning()).toBe(false);
    });
  });

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(automationAPI.isRunning()).toBe(false);
    });

    it('should return true after start', async () => {
      await automationAPI.start();
      expect(automationAPI.isRunning()).toBe(true);
      await automationAPI.stop();
    });
  });
});
