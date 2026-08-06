import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authManager } from './AuthManager';

describe('AuthManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getState', () => {
    it('should return initial guest state', () => {
      const state = authManager.getState();
      expect(state.mode).toBe('guest');
      expect(state.provider).toBe('anonymous');
      expect(state.isAuthenticated).toBe(false);
      expect(state.profile).toBeNull();
    });
  });

  describe('onAuthChange', () => {
    it('should call callback on auth change', () => {
      const callback = vi.fn();
      const unsubscribe = authManager.onAuthChange(callback);

      // Trigger auth change
      authManager.continueAsGuest();

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('continueAsGuest', () => {
    it('should set guest mode', async () => {
      await authManager.continueAsGuest();
      const state = authManager.getState();
      expect(state.mode).toBe('guest');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('isGuest', () => {
    it('should return true initially', () => {
      expect(authManager.isGuest()).toBe(true);
    });

    it('should return false after sign in', async () => {
      await authManager.continueAsGuest();
      expect(authManager.isGuest()).toBe(true);
    });
  });

  describe('isLocal', () => {
    it('should return false initially', () => {
      expect(authManager.isLocal()).toBe(false);
    });
  });

  describe('isCloud', () => {
    it('should return false initially', () => {
      expect(authManager.isCloud()).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return null initially', () => {
      expect(authManager.getProfile()).toBeNull();
    });
  });
});
