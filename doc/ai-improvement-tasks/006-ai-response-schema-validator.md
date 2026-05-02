# Problem
The AI divide response parser (`extractJsonArray`) does fragile JSON extraction with regex fallback. Invalid or malformed AI responses cause silent failures or `alert()` popups. No schema validation exists for AI responses.

# Improvement Needed
Add JSON schema validation for AI divide/reformulate responses with descriptive error messages and retry logic.

# Expected Result
Agents working on AI integration can trust that malformed AI responses are caught early with clear diagnostics instead of cryptic parse errors.
