import { Component, For, Show, createSignal } from 'solid-js';

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'modeling' | 'sculpting' | 'animation' | 'rendering';
  features: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'basic-cube',
    name: 'Basic Cube',
    description: 'Start with a simple cube and learn fundamental modeling',
    thumbnail: '/templates/basic-cube.png',
    category: 'modeling',
    features: ['Vertex editing', 'Basic materials', 'Simple UV']
  },
  {
    id: 'character-base',
    name: 'Character Base Mesh',
    description: 'A pre-proportioned base mesh for character creation',
    thumbnail: '/templates/character.png',
    category: 'sculpting',
    features: ['Symmetrical modeling', 'Human topology', 'UV preset']
  },
  {
    id: 'product-render',
    name: 'Product Visualization',
    description: 'Studio lighting setup for product renders',
    thumbnail: '/templates/product.png',
    category: 'rendering',
    features: ['3-point lighting', 'HDRI environment', 'Contact shadows']
  },
  {
    id: 'walk-cycle',
    name: 'Walk Cycle',
    description: 'Basic walk cycle animation rig and keyframes',
    thumbnail: '/templates/animation.png',
    category: 'animation',
    features: ['Rigged character', 'Keyframe presets', 'Graph editor']
  }
];

export const TemplateGallery: Component<{
  onSelect: (template: Template) => void;
}> = (props) => {
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(null);

  const categories = [
    { id: 'modeling', label: 'Modeling', icon: '📦' },
    { id: 'sculpting', label: 'Sculpting', icon: '🗿' },
    { id: 'animation', label: 'Animation', icon: '🎬' },
    { id: 'rendering', label: 'Rendering', icon: '✨' }
  ];

  const filteredTemplates = () => {
    const cat = selectedCategory();
    if (!cat) return TEMPLATES;
    return TEMPLATES.filter(t => t.category === cat);
  };

  return (
    <div class="template-gallery">
      <div class="category-filters">
        <button
          class={`filter-btn ${selectedCategory() === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        <For each={categories}>
          {(cat) => (
            <button
              class={`filter-btn ${selectedCategory() === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </button>
          )}
        </For>
      </div>

      <div class="template-grid">
        <For each={filteredTemplates()}>
          {(template) => (
            <button
              class="template-card"
              onClick={() => props.onSelect(template)}
            >
              <div class="template-thumbnail">
                <div class="placeholder-thumb">
                  <span>{template.name[0]}</span>
                </div>
              </div>
              <div class="template-info">
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <div class="template-features">
                  <For each={template.features.slice(0, 2)}>
                    {(feature) => <span class="feature-tag">{feature}</span>}
                  </For>
                </div>
              </div>
            </button>
          )}
        </For>
      </div>

      <style>{`
        .template-gallery {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .category-filters {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-full);
          color: var(--color-text-secondary);
          font-size: var(--font-sm);
          transition: all var(--transition-fast);
        }

        .filter-btn:hover {
          background: var(--color-bg-lighter);
          color: var(--color-text-primary);
        }

        .filter-btn.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-lg);
        }

        .template-card {
          display: flex;
          flex-direction: column;
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-lg);
          overflow: hidden;
          text-align: left;
          transition: all var(--transition-normal);
        }

        .template-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .template-thumbnail {
          height: 140px;
          background: var(--color-bg-darker);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-thumb {
          width: 80px;
          height: 80px;
          background: var(--color-primary);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-2xl);
          font-weight: bold;
          color: white;
        }

        .template-info {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .template-info h4 {
          margin: 0;
          font-size: var(--font-md);
        }

        .template-info p {
          margin: 0;
          font-size: var(--font-sm);
          color: var(--color-text-secondary);
        }

        .template-features {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .feature-tag {
          padding: 2px var(--spacing-sm);
          background: var(--color-bg-darker);
          border-radius: var(--radius-sm);
          font-size: var(--font-xs);
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
};

export { TEMPLATES };
