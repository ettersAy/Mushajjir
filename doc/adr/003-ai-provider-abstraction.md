# ADR 003: AI Provider Abstraction — OpenAI-Compatible HTTP Clients

**Status:** Accepted  
**Date:** 2025-04  
**Context:** The AI Divide and AI Reformulate features need to call LLM APIs. Multiple providers (OpenRouter, DeepSeek, Grok) have OpenAI-compatible chat completion endpoints with different base URLs, models, and API keys.

**Decision:** Abstract providers via a configuration object with `baseUrl`, `model`, and `apiKey` fields. Use raw `fetch()` for API calls with a common `callChatCompletion` helper.

**Rationale:**
- **Provider-agnostic** — Any OpenAI-compatible endpoint can be configured without code changes.
- **No SDK dependency** — Raw `fetch()` keeps the bundle small and avoids version conflicts between provider SDKs.
- **User-controlled** — Providers are stored in user settings (localStorage), not hardcoded beyond sensible defaults.
- **Simple abstraction** — The `aiService.js` module has two functions (`divideTask`, `reformulateTask`) that both call through `callChatCompletion`.

**Consequences:**
- Users must supply their own API keys — no bundled API credentials.
- Provider failures surface as native JS Errors with `alert()` fallback.
- Adding a new provider is a config change, not a code change.
- Rate limiting and retry logic are not yet implemented — left as future work.
