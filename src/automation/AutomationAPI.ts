/**
 * Automation API - Local API service for trusted integrations
 */

import { aiGateway } from '../ai/AIGateway';
import { projectStorage } from '../storage/ProjectStorage';
import { opfsStorage } from '../storage/OPFSStorage';

export interface AutomationServerOptions {
  port: number;
  allowedOrigins: string[];
  apiKey?: string;
}

export interface APIRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface APIResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

type RouteHandler = (params: Record<string, string>, body: unknown) => Promise<APIResponse>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

class AutomationAPI {
  private server: any = null;
  private routes: Route[] = [];
  private options: AutomationServerOptions = {
    port: 8765,
    allowedOrigins: ['http://localhost:*'],
  };

  constructor() {
    this.registerRoutes();
  }

  private registerRoutes() {
    // Project operations
    this.addRoute('GET', /^\/api\/projects$/, async () => {
      const projects = await projectStorage.getRecentProjects(50);
      return { projects };
    });

    this.addRoute('POST', /^\/api\/projects$/, async (_, body: any) => {
      const project = await projectStorage.addProject({
        name: body.name,
        path: body.path,
        lastOpened: new Date(),
      });
      return { project };
    });

    this.addRoute('GET', /^\/api\/projects\/([^/]+)$/, async (params) => {
      const project = await projectStorage.getRecentProjects(50);
      return { project: project.find(p => p.id === params[0]) };
    });

    // Scene operations
    this.addRoute('GET', /^\/api\/scene$/, async () => {
      const scene = await aiGateway.getSceneGraph().getScene();
      return { scene };
    });

    this.addRoute('POST', /^\/api\/scene\/objects$/, async (_, body: any) => {
      const object = await aiGateway.getSceneGraph().addObject(body.type, body.properties);
      return { object };
    });

    this.addRoute('DELETE', /^\/api\/scene\/objects\/([^/]+)$/, async (params) => {
      const success = await aiGateway.getSceneGraph().removeObject(params[0]);
      return { success };
    });

    this.addRoute('PATCH', /^\/api\/scene\/objects\/([^/]+)$/, async (params, body: any) => {
      const success = await aiGateway.getSceneGraph().modifyObject(params[0], body);
      return { success };
    });

    // Render operations
    this.addRoute('POST', /^\/api\/render$/, async (_, body: any) => {
      const result = await aiGateway.getRender().render(body.viewportOnly);
      return { success: !!result };
    });

    this.addRoute('GET', /^\/api\/render\/progress$/, async () => {
      const progress = await aiGateway.getRender().getRenderProgress();
      return { progress };
    });

    this.addRoute('POST', /^\/api\/render\/cancel$/, async () => {
      await aiGateway.getRender().cancelRender();
      return { success: true };
    });

    // File operations
    this.addRoute('POST', /^\/api\/files\/save$/, async (_, body: any) => {
      try {
        const buffer = new TextEncoder().encode(JSON.stringify(body.scene));
        const path = await opfsStorage.saveBlendFile(body.name, buffer);
        return { success: true, path };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    this.addRoute('GET', /^\/api\/files\/load$/, async (_, body: any) => {
      try {
        const buffer = await opfsStorage.loadBlendFile(body.path);
        return { success: true, data: buffer };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    // Plugin operations
    this.addRoute('GET', /^\/api\/plugins$/, async () => {
      // Import plugin manager dynamically to avoid circular deps
      const { pluginManager } = await import('../plugins/PluginManager');
      const plugins = pluginManager.getAllPlugins();
      return { plugins };
    });

    this.addRoute('POST', /^\/api\/plugins\/([^/]+)\/enable$/, async (params) => {
      const { pluginManager } = await import('../plugins/PluginManager');
      const result = await pluginManager.loadPlugin(params[0]);
      return { success: result.success, error: result.error };
    });

    this.addRoute('POST', /^\/api\/plugins\/([^/]+)\/disable$/, async (params) => {
      const { pluginManager } = await import('../plugins/PluginManager');
      await pluginManager.disablePlugin(params[0]);
      return { success: true };
    });

    // System info
    this.addRoute('GET', /^\/api\/system$/, async () => {
      const { HardwareProfiler } = await import('../core/HardwareProfiler');
      const profiler = new HardwareProfiler();
      const profile = await profiler.profile();
      return { system: profile };
    });
  }

  private addRoute(method: string, pattern: RegExp, handler: RouteHandler): void {
    this.routes.push({ method, pattern, handler });
  }

  private async handleRequest(request: APIRequest): Promise<APIResponse> {
    // Check origin
    const origin = request.headers['origin'];
    if (origin && !this.isOriginAllowed(origin)) {
      return {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Origin not allowed' },
      };
    }

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== request.method) continue;
      const match = request.path.match(route.pattern);
      if (match) {
        try {
          const params = match.slice(1);
          const response = await route.handler(
            params.reduce((acc, val, idx) => ({ ...acc, [idx]: val }), {}),
            request.body
          );
          return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: response,
          };
        } catch (error) {
          return {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: String(error) },
          };
        }
      }
    }

    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Not found' },
    };
  }

  private isOriginAllowed(origin: string): boolean {
    return this.options.allowedOrigins.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return regex.test(origin);
      }
      return pattern === origin;
    });
  }

  configure(options: Partial<AutomationServerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // Start the local API server
  async start(): Promise<void> {
    if (this.server) {
      console.warn('Automation API server already running');
      return;
    }

    // In a real implementation, this would use Deno.serve, Bun.serve, or Node.js http
    // For browser-only builds, this could use a SharedWorker or service worker
    console.log(`Automation API would start on port ${this.options.port}`);
    console.log('Allowed origins:', this.options.allowedOrigins);

    // Simulate server start
    this.server = { running: true };
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server = null;
      console.log('Automation API server stopped');
    }
  }

  isRunning(): boolean {
    return !!this.server?.running;
  }
}

export const automationAPI = new AutomationAPI();

// Export route handlers for external use
export { type RouteHandler, type Route };
