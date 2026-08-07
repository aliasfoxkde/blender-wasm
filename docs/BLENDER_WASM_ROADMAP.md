# Blender WASM Full MVP Roadmap

**Date**: 2026-08-07
**Status**: Current smoke test is non-functional placeholder. Real Blender WASM requires solving fundamental build system issues.

---

## The Core Problem

The Blender build system uses **Emscripten-compiled build tools** (`makesdna.js`, `datatoc.js`) that run in a **virtual filesystem overlay** and **cannot access real source files**. This is a fundamental architectural mismatch.

```
Emscripten Tool (JS/WASM) → Virtual FS Overlay → Real Filesystem
                                      ↑
                              PERMISSION DENIED
```

**Evidence from build log**:
```
/build/build/bin/datatoc.js: Permission denied
/build/build/bin/makesdna.js: Syntax error
```

---

## What We Need to Build

A working Blender-in-browser MVP requires:

1. **DNA system** - Blender's binary data serialization (makesdna)
2. **Static library compilation** - Compile Blender source to `.a`/`.wasm` archives
3. **Shader generation** - Convert GLSL to C arrays (datatoc)
4. **Final link** - Produce `blender.js` + `blender.wasm`
5. **Runtime bridge** - JavaScript interop for scene operations

---

## Phase 1: Fix Build Tools (Critical Path)

### Problem
Emscripten-compiled build tools (`datatoc.js`, `makesdna.js`) cannot read real files.

### Solution
Compile these tools **natively** instead of with Emscripten.

### Tasks

#### 1.1 Compile makesdna natively
```
# In Dockerfile, BEFORE emsdk cmake setup:
git clone --depth 1 --branch blender-v4.2-release https://github.com/blender/blender.git /build/src
cd /build/src
mkdir -p /build/bin-native
gcc -o /build/bin-native/makesdna source/blender/makesdna/intern/makesdna.c \
    -I source/blender \
    -I build_files \
    -I /build/src/extern/clew/include \
    -DHAVE_BROTLI \
    -DHAVE_OPENEXR \
    -lssl -lcrypto -lz -ljpeg -lpng -lbz2
```

#### 1.2 Compile datatoc natively
```
gcc -o /build/bin-native/datatoc source/blender/datatoc/datatoc.c \
    -I source/blender \
    -I build_files \
    -I extern/_utf8proc/include \
    -lm
```

#### 1.3 Update CMake to use native tools
In `build.sh`, set environment variables:
```bash
export CMAKE_DATATOC_EXECUTABLE=/build/bin-native/datatoc
export CMAKE_MAKESDNA_EXECUTABLE=/build/bin-native/makesdna
```

#### 1.4 Verify build tools work
```bash
/build/bin-native/makesdna --help
/build/bin-native/datatoc --help
```

**Deliverable**: Native build tools compile and run, producing real DNA and shader C files.

---

## Phase 2: DNA System Integration

### Problem
Blender uses DNA for binary serialization of .blend files. This requires makesdna to generate `DNA.c`, `DNA.h`, and `DNA_type_offsets.h`.

### Solution
Run makesdna on host, inject generated files into build.

### Tasks

#### 2.1 Generate DNA files on host
```bash
cd /build/src
./bin-native/makesdna \
    source/blender/blenlib/BLI_listbase.h \
    source/blender/blenlib/BLI_ghash.h \
    source/blender/makesdna/DNA_ID.h \
    > source/blender/makesdna/intern/DNA.c
```

#### 2.2 Pre-generate required DNA files
Create a script `docker/blender-wasm-build/scripts/generate-dna.sh` that:
1. Clones Blender source (shallow)
2. Compiles makesdna natively
3. Runs makesdna on all required headers
4. Outputs to `artifacts/dna/`

#### 2.3 Mount DNA files into container
In `docker-compose.yml`:
```yaml
volumes:
  - ../../artifacts/dna:/build/dna:ro
```

Then in `build.sh`, copy DNA files before build:
```bash
cp /build/dna/* /build/src/source/blender/makesdna/intern/
```

**Deliverable**: Real DNA system integrated into build.

---

## Phase 3: Shader Compilation Pipeline

### Problem
Blender has ~500 GLSL shader files. `datatoc.js` converts these to C arrays at build time.

### Solution
Pre-compile shaders using native datatoc, or use pre-generated shader arrays.

### Tasks

#### 3.1 Pre-generate shaders using native datatoc
```bash
cd /build/src
for shader in $(find source/blender -name "*.glsl"); do
    ./bin-native/datatoc "$shader" "/tmp/shaders/$(basename $shader).c"
done
```

#### 3.2 Create shader archive
```bash
cd /tmp/shaders
tar -cf /artifacts/shaders/shaders.tar $(find . -name "*.c")
```

#### 3.3 Inject into build
In `build.sh`, before Ninja:
```bash
tar -xf /artifacts/shaders/shaders.tar -C /build/src
```

#### 3.4 OR: Use ShaderHub pre-compiled
Blender Foundation may provide pre-compiled shader bundles. Check:
- https://archive.blender.org/developer/D9011

**Deliverable**: All shaders converted to C arrays without datatoc.js.

---

## Phase 4: Selective Module Compilation

### Problem
Full Blender (~4000 targets) is massive. We only need core functionality.

### Solution
Build only essential libraries as WASM archives.

### Tasks

#### 4.1 Identify essential targets
From CMake output, key libraries:
```
bf_intern_clog        # Logging
bf_intern_atomic      # Atomics
bf_intern_string      # String utilities
bf_intern_gsparse     # Geometry
bf_intern_memutil     # Memory utils
bf_blenlib            # Core library
bf_bmesh              # BMesh geometry
bf_editor_mesh        # Mesh editing
bf_editor_transform   # Transform system
```

#### 4.2 Build as static archives
```bash
ninja bf_blenlib/libbf_blenlib.a
ninja bf_bmesh/libbf_bmesh.a
ninja bf_editor_mesh/libbf_editor_mesh.a
```

#### 4.3 Create linkable WASM archive
```bash
# Combine all .a files
emar rcs libblender.a \
    bf_blenlib/libbf_blenlib.a \
    bf_bmesh/libbf_bmesh.a \
    # ... etc
```

**Deliverable**: Single `libblender.a` containing compiled Blender code.

---

## Phase 5: Emscripten Link with Custom Entry Point

### Problem
Need to link Blender libraries with Emscripten and expose a JS API.

### Solution
Create a minimal Emscripten wrapper that:
1. Links against `libblender.a`
2. Exports narrow C API
3. Provides JS bridge

### Tasks

#### 5.1 Create wrapper C file
```c
// blender_wrapper.c
#include "blender/blenlib/BLI_path_util.h"
#include "blender/makesdna/DNA_scene_types.h"

char* bw_get_version_json(void) {
    return "{\"version\": \"4.2.0-wasm\", \"build\": \"custom\"}";
}

Scene* bw_create_scene(void) {
    return ...; // Call Blender's scene creation
}

char* bw_scene_to_json(Scene *scene) {
    return ...; // Serialize scene to JSON
}
```

#### 5.2 Compile with Emscripten
```bash
emcc blender_wrapper.c \
    libblender.a \
    -sLINKABLE=1 \
    -sMODULARIZE=1 \
    -sEXPORT_NAME=CreateBlenderWasmModule \
    -sEXPORTED_FUNCTIONS=_bw_get_version_json,_bw_create_scene,_bw_scene_to_json \
    -sALLOW_MEMORY_GROWTH=1 \
    -sWASM=1 \
    -o blender.js
```

#### 5.3 Verify in browser
```javascript
const module = await CreateBlenderWasmModule({ noInitialRun: true });
const version = module.UTF8ToString(module._bw_get_version_json());
console.log('Blender version:', version);
```

**Deliverable**: Real Blender code compiled to WASM with JS API.

---

## Phase 6: Runtime Bridge Integration

### Problem
Need to integrate WASM module with existing web app architecture.

### Solution
Update `EmscriptenBlenderRuntime` to use real Blender module.

### Tasks

#### 6.1 Update EmscriptenBlenderRuntime
```typescript
async load(options?: { canvas?: HTMLCanvasElement }): Promise<BlenderRuntimeInstance> {
    const ModuleFactory = (globalThis as Record<string, unknown>).CreateBlenderWasmModule;
    const module = await ModuleFactory({
        locateFile: (f: string) => `/wasm/blender/${f}`,
        print: (m: string) => console.log('[Blender]', m),
        printErr: (m: string) => console.error('[Blender]', m),
        canvas: options?.canvas,
        noInitialRun: true,
    });

    this.instance = { module, buildInfo: this.extractBuildInfo(module) };
    return this.instance;
}
```

#### 6.2 Implement smoke test call
```typescript
async runSmokeTest(): Promise<SmokeTestResult> {
    const module = this.instance.module;
    if (module._bw_run_smoke_test) {
        const resultPtr = module._bw_run_smoke_test();
        const result = JSON.parse(module.UTF8ToString(resultPtr));
        return result;
    }
    return { success: true, message: 'Runtime loaded' };
}
```

#### 6.3 Add version info display
In `BlenderViewport.tsx`, show:
- Blender version
- Build date
- Compiler info

**Deliverable**: UI displays real Blender version from compiled WASM.

---

## Phase 7: Scene Operations API

### Problem
Need to prove Blender can actually do something useful.

### Solution
Expose scene creation and mesh generation via JS API.

### Tasks

#### 7.1 Implement core functions in wrapper
```c
char* bw_create_cube(float size) {
    // Use Blender's mesh creation API
    Mesh *mesh = BKE_mesh_add_cube(size);
    // Convert to JSON for JS
    return mesh_to_json(mesh);
}
```

#### 7.2 Call from JS
```typescript
const cubePtr = module._bw_create_cube(1.0);
const cubeJson = module.UTF8ToString(cubePtr);
const cubeData = JSON.parse(cubeJson);
console.log('Created cube with', cubeData.vertex_count, 'vertices');
```

#### 7.3 Display in UI
Show mesh statistics (vertices, faces, etc.) to prove Blender code ran.

**Deliverable**: UI shows "Created cube with 24 vertices" proving real Blender code executed.

---

## Phase 8: Memory Management

### Problem
Blender is memory-intensive. 8GB max memory needs careful handling.

### Solution
Configure Emscripten memory settings properly.

### Tasks

#### 8.1 Set memory limits
```bash
emcc ... \
    -sINITIAL_MEMORY=256MB \
    -sMAXIMUM_MEMORY=8GB \
    -sALLOW_MEMORY_GROWTH=1 \
    -sSTACK_SIZE=8MB
```

#### 8.2 Implement memory pressure handling
```typescript
module.onRuntimeInitialized = () => {
    // Blender is ready
    console.log('Memory:', module.TOTAL_MEMORY / 1024 / 1024, 'MB');
};
```

#### 8.3 Add progress indicator
Show memory usage in BlenderViewport status bar.

**Deliverable**: Memory-aware Blender running with growth support.

---

## Phase 9: Incremental Feature Expansion

### Problem
MVP is useful but limited.

### Solution
Add features incrementally.

### Tasks

#### 9.1 Add more mesh types
- UV Sphere
- Ico Sphere
- Cylinder
- Plane

#### 9.2 Add material support
- Basic PBR material
- Color/roughness

#### 9.3 Add export
- Export scene as JSON
- Export mesh as OBJ

#### 9.4 Add import
- Import simple OBJ

#### 9.5 Add rendering (future)
- Headless render to image
- WebGL preview (hardest)

---

## Timeline Estimate

| Phase | Complexity | Est. Time |
|-------|-------------|-----------|
| Phase 1: Fix Build Tools | High | 1-2 days |
| Phase 2: DNA Integration | Medium | 4-8 hours |
| Phase 3: Shader Pipeline | Medium | 4-8 hours |
| Phase 4: Selective Compilation | Medium | 4-8 hours |
| Phase 5: Emscripten Link | High | 1-2 days |
| Phase 6: Runtime Bridge | Low | 2-4 hours |
| Phase 7: Scene API | Medium | 4-8 hours |
| Phase 8: Memory | Low | 2-4 hours |
| Phase 9: Expansion | Ongoing | Per feature |

**Total to basic functionality**: 3-5 days
**Total to MVP complete**: 1-2 weeks

---

## Immediate Next Action

**Compile makexdna.c and datatoc.c natively as standalone host executables.**

This is the critical path blocker. Without native build tools, nothing else works.

```bash
# Step 1: Find the source files
find /build/src -name "makesdna.c" -o -name "datatoc.c"

# Step 2: Compile with gcc (native, not emscripten)
gcc -o /tmp/makesdna /path/to/makesdna.c -I/build/src/source/blender -lm

# Step 3: Test on host
/tmp/makesdna /path/to/DNA_ID.h
```

Once native tools work, the rest of the pipeline follows.

---

## Verification Commands

```bash
# Verify native makesdna works
docker run --rm blender-wasm-build bash -c '
    /build/bin-native/makesdna --help
'

# Verify shader generation
docker run --rm blender-wasm-build bash -c '
    /build/bin-native/datatoc /build/src/source/blender/shaders/test.glsl /tmp/test.c
'

# Full build attempt
./scripts/build-blender-wasm.sh build 2>&1 | tee artifacts/logs/build.log
```

---

## Current Gaps in Knowledge

1. **Which exact headers makesdna needs** - May require trial/error
2. **Full list of datatoc dependencies** - Shader compilation has many includes
3. **Minimal set of Blender libraries** - Need to find smallest viable subset
4. **Blender's internal API** - Unclear how to call mesh creation from external code

## Investigation Notes (2026-08-07)

### makesdna.js Analysis
- Compiled with Emscripten, runs in virtual FS overlay
- Uses `NODERAWFS` flag but filesystem still uses virtual overlay
- `arguments_` global is reset internally, hard to override
- Input files must be in virtual FS to be readable

### Attempted Fixes
1. `NODERAWFS=1` - Does not bypass virtual FS for file reads
2. `FS_ROOT` override - Does not work as expected
3. `arguments_` override - Reset internally by Emscripten runtime

### Alternative Approaches

**Option A: Pre-generate DNA on host**
- Create a Python script that parses Blender's C headers
- Generate equivalent DNA output without makesdna
- Inject pre-generated files into build

**Option B: Use Blender's pre-built DNA**
- Blender releases may include pre-generated DNA files
- Check blender.org release tarballs for `intern/dna.c`

**Option C: Skip DNA for minimal build**
- Some Blender code paths may work without full DNA
- Start with blenlib, exclude higher-level subsystems

### Next Investigation Steps

```bash
# Check if Blender release has pre-generated DNA
curl -s https://download.blender.org/release/Blender4.2/ | grep -i dna

# Try Python-based DNA parser
python3 -c "
import re
# Minimal DNA header parser
"
```

**Decision**: Update roadmap with findings, continue systematic investigation.
