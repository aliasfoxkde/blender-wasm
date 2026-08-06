# Future Improvements

## TASKS
- [ ] Create an extension/plugin/theme manager to allow users to easily add and share them
- [ ] API backend compatible with MCP servers for managing Blender4Web (WASM)
- [ ] Integrate AI directly into the Blender web app; this could connect via API/MCP in 
      the browser to streamline the process, and reduces the technical overhead.
- [ ] Get test, code, and documentation coverage to over 99%
  - [ ] Initially just for our code but then for Blender code itself.
- [ ] Create API Backend observability, configuration, and interactive documentation dashboard
  - [ ] Include logging, performance metrics, monitoring, authentication management, and etc.
- [ ] Integrate Alibaba Page Agent (or custom, etc.) to control the GUI
      See: https://github.com/alibaba/page-agent
- [ ] Do aggressive SIMD optimizations, smart routing, and lazy loading (only data used)
  - [ ] "Learn" the users behavior and enable just the features they use, etc.
  - [ ] Could a smarter search algorithm, multithreading/tasking, etc. be implemented?
- [ ] Implement an Unreal-like asset marketplace
- [ ] Script automation with official and community presets, etc.
- [ ] Create a feature rich video library for using this application, etc.
  - [ ] MVP could focus on things that are different for web (login, setup, change version, etc.)
- [ ] Add idle optimizations that lower resource usage when rendering is not needed, such 
      as running background process, API headless operations, and so on?
- [ ] Optimize caching data locally for rendering, processing, metadata, preview images, etc.

## Benchmarking

## Q & A:
- Can we reach "perceived" native performance in the browser?
- Can we implement something similar to Unity does with the use of AI (to build assets, interact with Unity through the CLI, etc.)? This requires extensive research and planning.

Notes: 
- Faster or slower is not the metric, the user experience and perceived performance is. The portable nature of the app across multiple devices (with login and simple DB storage), ease of setup/installation (basically one click), configuration (once and it also learns), reliability (always up to date, validated, etc.), etc. is...
- We need a consistant way/script that pulls the latest blender version and compiles it for the web, ensures feature parity, and integrates easily with our system reliability. But we should also maintain a drop down menu that can switch versions on the fly for the user (basically just a prior Cloudflare deployment, so it will already be available).