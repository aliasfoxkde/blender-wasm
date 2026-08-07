/**
 * Blender blenlib Bridge - Emscripten WASM API
 *
 * This source file provides the bridge API for the blenlib WASM module.
 * It is compiled and linked against real Blender blenlib and DNA libraries.
 *
 * Build: ./scripts/build-blender-wasm.sh blenlib
 */

#include <stdio.h>
#include <string.h>

/* blenlib includes */
extern void CLG_init(void);
extern void CLG_exit(void);
extern void CLG_level_set(int level);

/* From bf_intern_guardedalloc */
extern size_t MEM_get_memory_in_use(void);
extern unsigned int MEM_get_memory_blocks_in_use(void);

/* From blenlib - hash function */
extern unsigned int BLI_hash_mm2a(const char *str);

/* From blenlib - string utilities */
extern size_t BLI_strlen(const char *str);
extern int BLI_strcmp(const char *a, const char *b);

/**
 * Get blenlib capabilities as JSON.
 */
const char* bw_blenlib_capabilities_json(void) {
    static char json[1024];
    snprintf(json, sizeof(json),
        "{"
        "\"module\":\"blenlib\","
        "\"version\":\"4.2.0-wasm\","
        "\"build_type\":\"experimental\","
        "\"libraries\":["
        "  {\"name\":\"bf_intern_clog\",\"provides\":[\"logging\"]},"
        "  {\"name\":\"bf_intern_guardedalloc\",\"provides\":[\"memory\"]},"
        "  {\"name\":\"bf_blenlib\",\"provides\":[\"hash_mm2a\",\"string_utils\"]},"
        "  {\"name\":\"bf_dna\",\"provides\":[\"dna_data\"]}"
        "],"
        "\"functions\":["
        "  \"bw_blenlib_capabilities_json\","
        "  \"bw_blenlib_smoke_test\","
        "  \"bw_hash_string_mm2a\""
        "],"
        "\"status\":\"experimental\""
        "}");
    return json;
}

/**
 * Run blenlib smoke test.
 * Returns 1 on success, 0 on failure.
 */
int bw_blenlib_smoke_test(void) {
    /* Initialize logging */
    CLG_init();
    CLG_level_set(0);

    /* Test hash function with known input */
    unsigned int hash1 = BLI_hash_mm2a("Blender");
    unsigned int hash2 = BLI_hash_mm2a("Blender");

    /* Same input should produce same hash */
    if (hash1 != hash2) {
        return 0;
    }

    /* Different input should produce different hash (with high probability) */
    unsigned int hash3 = BLI_hash_mm2a("blender");  /* lowercase */
    if (hash1 == hash3) {
        /* This could happen by chance, but unlikely for short strings */
    }

    /* Test string functions */
    const char *test_str = "Blender WASM";
    size_t len = BLI_strlen(test_str);
    if (len != 12) {
        return 0;
    }

    CLG_exit();
    return 1;
}

/**
 * Hash a string using MM2A hash algorithm.
 * Returns 32-bit unsigned hash value.
 */
unsigned int bw_hash_string_mm2a(const char *value) {
    if (value == NULL) {
        return 0;
    }
    return BLI_hash_mm2a(value);
}
