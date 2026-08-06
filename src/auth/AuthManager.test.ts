import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthManager } from './AuthManager';

describe('AuthManager', () => {
  let auth: AuthManager;

  beforeEach(() => {
    auth = new AuthManager();
    vi.clearAllMocks();
  });

  describe('getState', () => {
    it('should return initial guest state', () => {
      const state = auth.getState();
      expect(state.mode).toBe('guest');
      expect(state.provider).toBe('anonymous');
      expect(state.isAuthenticated).toBe(false);
      expect(state.profile).toBeNull();
    });
  });

  describe('onAuthChange', () => {
    it('should call callback on auth change', () => {
      const callback = vi.fn();
      const unsubscribe = auth.onAuthChange(callback);

      // Trigger auth change
      auth.continueAsGuest();

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('continueAsGuest', () => {
    it('should set guest mode', async () => {
      await auth.continueAsGuest();
      const state = auth.getState();
      expect(state.mode).toBe('guest');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('isGuest', () => {
    it('should return true initially', () => {
      expect(auth.isGuest()).toBe(true);
    });

    it('should return false after sign in', async () => {
      await auth.continueAsGuest();
      expect(auth.isGuest()).toBe(true);
    });
  });

  describe('isLocal', () => {
    it('should return false initially', () => {
      expect(auth.isLocal()).toBe(false);
    });
  });

  describe('isCloud', () => {
    it('should return false initially', () => {
      expect(auth.isCloud()).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return null initially', () => {
      expect(auth.getProfile()).toBeNull();
    });
  });
});
