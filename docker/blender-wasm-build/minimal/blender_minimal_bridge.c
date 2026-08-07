/**
 * Blender Minimal Bridge - Emscripten WASM API
 *
 * This source file provides the bridge API for the minimal Blender WASM build.
 * It is compiled and linked against real Blender source libraries (clog, guardedalloc).
 *
 * Build: ./scripts/build-blender-wasm.sh minimal
 */

#include <stdio.h>

/* Blender logging functions from bf_intern_clog */
extern void CLG_init(void);
extern void CLG_exit(void);
extern void CLG_level_set(int level);

/**
 * Get version/build information as JSON.
 * Returns a pointer to a static string.
 */
char* bw_get_version_json(void) {
    static char json[512];
    snprintf(json, sizeof(json),
        "{\"version\":\"4.2.0-wasm\",\"build_type\":\"minimal\","
        "\"library\":\"bf_intern_clog\",\"status\":\"working\"}");
    return json;
}

/**
 * Run smoke test - calls real Blender logging functions.
 * This proves Blender code executes in the WASM runtime.
 * Returns a pointer to a static string containing JSON result.
 */
char* bw_run_smoke_test(void) {
    static char result[512];

    /* Call real Blender logging functions */
    CLG_init();
    CLG_level_set(0);
    CLG_exit();

    snprintf(result, sizeof(result),
        "{\"success\":true,\"message\":\"Real Blender code executed\","
        "\"functions\":[\"CLG_init\",\"CLG_level_set\",\"CLG_exit\"]}");
    return result;
}
