// Pointer-based trivially copyable ustring using string interning
// This stub provides OpenImageIO-compatible ustring for Emscripten/WASM builds
#pragma once

#include <string>
#include <string_view>
#include <cstdint>
#include <cstring>
#include <unordered_map>
#include <mutex>
#include <memory>

namespace OpenImageIO {

namespace Strutil {
  inline uint64_t strhash64(size_t len, const char *str) {
    uint64_t h = 14695981039346656037ULL;
    for (size_t i = 0; i < len; i++) {
      h ^= static_cast<uint64_t>(str[i]);
      h *= 1099511628211ULL;
    }
    return h;
  }
  inline uint64_t strhash64(std::string_view sv) {
    return strhash64(sv.size(), sv.data());
  }
}

// Global string intern table - pointer-based
class ustring_intern {
public:
  // Intern a string, return stable pointer to interned string
  static const std::string* intern(const char* str, size_t len) {
    std::string key(str, len);

    std::lock_guard<std::mutex> lock(mutex_);

    // Check if already interned
    auto it = map_.find(key);
    if (it != map_.end()) {
      return it->second.get();
    }

    // Add new interned string
    auto ptr = std::make_unique<std::string>(str, len);
    const std::string* result = ptr.get();
    map_.emplace(*ptr, std::move(ptr));
    return result;
  }

  static const std::string* lookup_empty() {
    static const std::string empty("");
    return &empty;
  }

private:
  static inline std::mutex mutex_;
  static inline std::unordered_map<std::string, std::unique_ptr<std::string>> map_;
};

// Trivially copyable ustring - stores pointer to interned string
struct ustring {
  const std::string* ptr = nullptr;

  constexpr ustring() noexcept = default;
  constexpr ustring(const ustring&) noexcept = default;
  constexpr ustring& operator=(const ustring&) noexcept = default;

  explicit ustring(std::string_view sv) noexcept
      : ptr(ustring_intern::intern(sv.data(), sv.size())) {}

  const char* c_str() const { return ptr ? ptr->c_str() : ""; }
  size_t length() const { return ptr ? ptr->size() : 0; }
  size_t size() const { return length(); }
  bool empty() const { return !ptr || ptr->empty(); }
  uint64_t hash() const { return ptr ? Strutil::strhash64(*ptr) : 0; }

  const std::string& string() const {
    static const std::string empty_string;
    return ptr ? *ptr : empty_string;
  }

  char operator[](size_t i) const {
    if (!ptr || i >= ptr->size()) return '\0';
    return (*ptr)[i];
  }

  bool operator==(const ustring& other) const {
    if (ptr == other.ptr) return true;
    if (!ptr || !other.ptr) return false;
    return *ptr == *other.ptr;
  }

  bool operator==(std::string_view sv) const {
    if (!ptr) return sv.empty();
    return *ptr == sv;
  }

  operator std::string_view() const {
    if (!ptr) return std::string_view();
    return std::string_view(*ptr);
  }
};

inline bool operator==(std::string_view a, const ustring& b) { return b == a; }

} // namespace OpenImageIO
