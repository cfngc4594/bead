<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI state parity

When changing visible UI, navigation, toolbar actions, or interaction entry points, also check and update the matching skeleton/loading/empty/mobile states in the same change. Do not leave placeholder button counts or responsive fallback surfaces out of sync with the real UI.
