/**
 * Blender Minimal Bridge - Emscripten WASM API
 *
 * This source file provides the bridge API for the minimal Blender WASM build.
 * It is compiled and linked against real Blender source libraries (clog, guardedalloc).
 *
 * Build: ./scripts/build-blender-wasm.sh minimal
 */

#include <stdio.h>
#include <string.h>

/* Blender logging functions from bf_intern_clog */
extern void CLG_init(void);
extern void CLG_exit(void);
extern void CLG_level_set(int level);

/* Blender guarded memory functions from bf_intern_guardedalloc */
extern size_t MEM_get_memory_in_use(void);
extern unsigned int MEM_get_memory_blocks_in_use(void);
extern size_t MEM_get_peak_memory(void);
extern void MEM_printmemlist_stats(void);

/* Helper to safely copy string to fixed buffer */
static void safe_copy_json(char *dest, const char *src, size_t max_len) {
    size_t len = strlen(src);
    if (len >= max_len) len = max_len - 1;
    memcpy(dest, src, len);
    dest[len] = '\0';
}

/**
 * Get version/build information as JSON.
 * Returns a pointer to a static string.
 */
char* bw_get_version_json(void) {
    static char json[512];
    snprintf(json, sizeof(json),
        "{\"version\":\"4.2.0-wasm\",\"build_type\":\"minimal\","
        "\"libraries\":[\"bf_intern_clog\",\"bf_intern_guardedalloc\"],"
        "\"status\":\"working\"}");
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

/**
 * Get memory statistics from Blender's guarded allocator.
 * Returns JSON with memory usage information.
 */
char* bw_get_memory_stats(void) {
    static char result[512];
    size_t mem_in_use = MEM_get_memory_in_use();
    unsigned int blocks = MEM_get_memory_blocks_in_use();
    size_t peak_mem = MEM_get_peak_memory();

    snprintf(result, sizeof(result),
        "{\"memory_in_use\":%zu,\"memory_blocks\":%u,\"peak_memory\":%zu,"
        "\"success\":true}",
        mem_in_use, blocks, peak_mem);
    return result;
}

/**
 * Get a summary of what the minimal baseline provides.
 * Returns JSON with API capabilities.
 */
char* bw_get_api_summary(void) {
    static char json[1024];
    size_t mem_in_use = MEM_get_memory_in_use();

    snprintf(json, sizeof(json),
        "{"
        "\"version\":\"4.2.0-wasm\","
        "\"build_type\":\"minimal\","
        "\"libraries\":["
        "  {\"name\":\"bf_intern_clog\",\"provides\":[\"logging\",\"level_set\",\"init\",\"exit\"]},"
        "  {\"name\":\"bf_intern_guardedalloc\",\"provides\":[\"memory_allocation\",\"memory_stats\",\"memory_peak\"]}"
        "],"
        "\"api_functions\":["
        "  \"bw_get_version_json\","
        "  \"bw_run_smoke_test\","
        "  \"bw_get_memory_stats\","
        "  \"bw_get_api_summary\""
        "],"
        "\"memory_in_use\":%zu,"
        "\"status\":\"minimal_baseline\""
        "}",
        mem_in_use);
    return json;
}
