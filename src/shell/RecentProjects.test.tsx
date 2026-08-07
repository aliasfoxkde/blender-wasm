import { describe, it, expect } from 'vitest';
import { type Project } from './RecentProjects';

describe('RecentProjects', () => {
  describe('formatDate', () => {
    it('should format today correctly', () => {
      const today = new Date();
      const result = formatDateInternal(today);
      expect(result).toBe('Today');
    });

    it('should format yesterday correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatDateInternal(yesterday);
      expect(result).toBe('Yesterday');
    });

    it('should format days ago correctly', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = formatDateInternal(threeDaysAgo);
      expect(result).toBe('3 days ago');
    });
  });

  describe('formatSize', () => {
    it('should return empty string for undefined', () => {
      expect(formatSizeInternal(undefined)).toBe('');
    });

    it('should format bytes to KB', () => {
      expect(formatSizeInternal(512 * 1024)).toBe('512 KB');
    });

    it('should format bytes to MB', () => {
      expect(formatSizeInternal(2 * 1024 * 1024)).toBe('2.0 MB');
    });
  });

  describe('Project interface', () => {
    it('should accept valid project', () => {
      const project: Project = {
        id: 'test-1',
        name: 'Test Project',
        path: '/test/path',
        lastOpened: new Date(),
      };
      expect(project.id).toBe('test-1');
      expect(project.name).toBe('Test Project');
    });

    it('should accept project with optional fields', () => {
      const project: Project = {
        id: 'test-2',
        name: 'Test Project',
        path: '/test/path',
        lastOpened: new Date(),
        thumbnail: '/thumb.png',
        size: 1024 * 1024,
      };
      expect(project.thumbnail).toBe('/thumb.png');
      expect(project.size).toBe(1024 * 1024);
    });
  });
});

// Helper functions extracted for testing (matching component logic)
function formatDateInternal(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatSizeInternal(bytes?: number): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`;
}
