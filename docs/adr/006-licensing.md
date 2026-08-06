# ADR 006: Licensing

## Status
Accepted

## Context
We need an open-source license compatible with Blender's GPL licensing.

## Decision
Use **GPL-3.0-or-later** for core code with **MIT** for tooling and scripts.

## Rationale
- Blender itself is GPL-3.0-or-later
- Our web platform wraps/complements Blender WASM
- GPL ensures derivative works remain open source
- MIT for build scripts and tooling allows maximum reuse

## License Structure
```
LICENSE
├── GPL-3.0-or-later (core application)
└── MIT (scripts, tooling, configuration)
```

## Modules and Licensing
| Module | License | Rationale |
|--------|---------|-----------|
| Web Shell | GPL-3.0-or-later | Derivative of Blender runtime |
| Runtime Loader | GPL-3.0-or-later | Interfaces with GPL code |
| Build Scripts | MIT | Utility scripts |
| PWA/Service Worker | MIT | Independent tooling |
| Documentation | CC-BY-4.0 | Creative content |

## Consequences
- Any modifications to Blender WASM integration must be published under GPL
- Contributors must agree to GPL licensing
- Commercial closed-source forks are not permitted

## References
- Blender License: https://www.blender.org/about/license/
- GPL-3.0: https://www.gnu.org/licenses/gpl-3.0.html
- MIT License: https://opensource.org/licenses/MIT
