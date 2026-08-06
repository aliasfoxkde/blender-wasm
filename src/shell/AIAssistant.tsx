import { Component, createSignal, For, Show } from 'solid-js';

export interface AICommand {
  id: string;
  prompt: string;
  timestamp: Date;
}

export const AIAssistant: Component = () => {
  const [input, setInput] = createSignal('');
  const [history, setHistory] = createSignal<AICommand[]>([]);
  const [isProcessing, setIsProcessing] = createSignal(false);

  const quickActions = [
    { label: 'Add a cube', prompt: 'Add a cube to the scene' },
    { label: 'Add a sphere', prompt: 'Add a UV sphere' },
    { label: 'Add light', prompt: 'Add a sun light' },
    { label: 'Open properties', prompt: 'Open the properties panel' }
  ];

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const value = input().trim();
    if (!value) return;

    const command: AICommand = {
      id: crypto.randomUUID(),
      prompt: value,
      timestamp: new Date()
    };

    setHistory([...history(), command]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      // In real implementation, this would call the AI API
    }, 1000);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div class="ai-assistant">
      <div class="assistant-header">
        <h3>
          <span class="assistant-icon">🤖</span>
          AI Assistant
        </h3>
        <span class="assistant-status">
          {isProcessing() ? 'Thinking...' : 'Ready'}
        </span>
      </div>

      <div class="quick-actions">
        <For each={quickActions}>
          {(action) => (
            <button
              class="quick-action-btn"
              onClick={() => handleQuickAction(action.prompt)}
            >
              {action.label}
            </button>
          )}
        </For>
      </div>

      <Show when={history().length > 0}>
        <div class="command-history">
          <For each={history()}>
            {(cmd) => (
              <div class="history-item">
                <span class="history-prompt">{cmd.prompt}</span>
                <span class="history-time">
                  {cmd.timestamp.toLocaleTimeString()}
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>

      <form class="assistant-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask AI to help with your scene..."
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
        />
        <button type="submit" disabled={!input().trim() || isProcessing()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </form>

      <style>{`
        .ai-assistant {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-light);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-bg-lighter);
        }

        .assistant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .assistant-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-md);
        }

        .assistant-icon {
          font-size: var(--font-lg);
        }

        .assistant-status {
          font-size: var(--font-xs);
          color: var(--color-text-muted);
        }

        .quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }

        .quick-action-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-bg-darker);
          border-radius: var(--radius-sm);
          font-size: var(--font-xs);
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .quick-action-btn:hover {
          background: var(--color-primary);
          color: white;
        }

        .command-history {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          max-height: 150px;
          overflow-y: auto;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-bg-darker);
          border-radius: var(--radius-sm);
          font-size: var(--font-xs);
        }

        .history-prompt {
          color: var(--color-text-secondary);
        }

        .history-time {
          color: var(--color-text-muted);
        }

        .assistant-input {
          display: flex;
          gap: var(--spacing-sm);
        }

        .assistant-input input {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-darker);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--font-sm);
        }

        .assistant-input input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .assistant-input input::placeholder {
          color: var(--color-text-muted);
        }

        .assistant-input button {
          width: 40px;
          height: 40px;
          background: var(--color-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: background var(--transition-fast);
        }

        .assistant-input button:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        .assistant-input button:disabled {
          background: var(--color-bg-lighter);
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
};
