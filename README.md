# ChatPWA

An elegant Progressive Web App for AI chat with custom API endpoints. Connect to OpenAI, Anthropic, Google Gemini, or any compatible API by configuring your endpoint URL, model name, and authentication token.

![ChatPWA Screenshot](UI.pen)

## Features

✨ **Multi-Provider Support** - Works with OpenAI, Anthropic (Claude), and Google Gemini APIs
🎨 **Elegant Bubble Chat** - Left-aligned AI messages, right-aligned user messages with smooth animations
💬 **Slash Commands** - `/image` command for AI image generation with autocomplete
📝 **Markdown Support** - Full markdown rendering with code syntax highlighting
🎯 **Smart Typing Indicator** - Animated dots show when AI is responding
💾 **Auto-Save Everything** - Messages and settings persist automatically (IndexedDB + localStorage)
🔒 **Privacy First** - All data stays on your device, no external tracking
📱 **Install as App** - Add to home screen for native-like experience
⚡ **Fast & Lightweight** - Built with Vue 3 + Vite + Tailwind CSS v4

## Tech Stack

- **Vue 3.5.28** - Composition API with `<script setup>` syntax
- **Vite 7.3.1** - Lightning-fast development and optimized builds
- **Tailwind CSS 4.2.0** - Custom design system via `@tailwindcss/vite` plugin
- **Dexie 4.3.0** - IndexedDB wrapper for chat history persistence
- **Marked 17.0.3** - Markdown rendering in AI responses
- **Highlight.js 11.11.1** - Code syntax highlighting

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ChatPWA

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Build for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## Usage

### First Time Setup

1. Launch the app - you'll see the Welcome screen
2. Click "Get Started"
3. Configure your API:
   - **API Endpoint URL**: e.g., `https://api.openai.com/v1`
   - **Model Name**: e.g., `gpt-4`, `claude-opus-4`, `gemini-pro`
   - **Authentication Token**: Your API key (without "Bearer " prefix)
4. Settings auto-save as you type

### Supported Providers

**OpenAI (Default):**
- Endpoint: `https://api.openai.com/v1`
- Models: `gpt-4`, `gpt-3.5-turbo`, etc.
- Chat path: `/chat/completions`

**Anthropic (Claude):**
- Endpoint: `https://api.anthropic.com/v1`
- Models: `claude-opus-4`, `claude-sonnet-4`, etc.
- Chat path: `/messages`

**Google Gemini:**
- Endpoint: `https://generativelanguage.googleapis.com/v1beta`
- Models: `gemini-pro`, `gemini-1.5-pro`, etc.
- Chat path: `/models/{model}:generateContent`

### Chatting

1. Type your message in the input field
2. Press **Enter** to send (or **Shift+Enter** for new line)
3. User messages appear on the right (green background)
4. AI responses appear on the left with model name footer
5. Typing indicator shows bouncing dots while waiting

### Slash Commands

Type `/` to see available commands:
- `/image [prompt]` - Generate an image using DALL-E
- `/img [prompt]` - Short alias for `/image`

Example: `/image a sunset over mountains`

### Image Generation

1. Go to Settings → Advanced Options → Image Generation Settings
2. Configure:
   - **Image Model**: e.g., `dall-e-3`, `dall-e-2`
   - **Image Size**: 256x256, 512x512, 1024x1024, etc.
   - **Image Quality**: Standard or HD
3. Use `/image` command in chat
4. Images display directly in chat as base64

### Settings

- Click the ⚙️ icon in the chat header
- All settings auto-save on change
- **Connection Test**: Verify your API configuration
- **Clear Chat History**: Delete all messages (cannot be undone)

## Project Structure

```
ChatPWA/
├── src/
│   ├── components/
│   │   ├── ChatMessage.vue      # Bubble-style message with markdown
│   │   ├── MessageInput.vue     # Input with slash command menu
│   │   ├── TypingIndicator.vue  # Animated typing dots
│   │   ├── EmptyState.vue       # Empty chat placeholder
│   │   └── SettingsForm.vue     # API configuration form
│   ├── composables/
│   │   ├── useApi.js            # Multi-provider API client
│   │   ├── useChat.js           # Message state + IndexedDB
│   │   └── useStorage.js        # Config persistence (singleton)
│   ├── views/
│   │   ├── WelcomeView.vue      # Onboarding screen
│   │   ├── ChatView.vue         # Main chat with fixed header
│   │   └── SettingsView.vue     # Settings with fixed header
│   ├── style.css                # Tailwind v4 theme + animations
│   ├── App.vue                  # Root component with routing
│   └── main.js                  # Application entry point
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # App icons (192x192, 512x512)
└── CLAUDE.md                    # Development guidance
```

## Design System

**Color Palette:**
- Background: `#F5F4F1` (warm cream)
- Surface: `#FFFFFF` (white cards)
- Primary: `#3D8A5A` (forest green)
- Accent: `#C8F0D8` (light green)
- Text hierarchy: `#1A1918`, `#6D6C6A`, `#9C9B99`

**Typography:**
- Font: Outfit (Google Fonts)
- Weights: 400, 500, 600, 700

**Design Principles:**
- Bubble-style chat layout
- Rounded corners: `rounded-2xl` with cut corners
- Soft shadows (8% opacity)
- Smooth fade-in animations
- Fixed headers (always visible)
- Auto-scroll to bottom

## Architecture

**Three-Layer Pattern:**
1. **Views** - Full-screen pages with fixed headers
2. **Components** - Reusable UI elements
3. **Composables** - Business logic (singleton pattern)

**Data Flow:**
```
User Input → Views → Composables → API/Storage
                ↓         ↓
            Components   Auto-Save
```

**Key Patterns:**
- Singleton composables (module-level refs)
- Auto-save with Vue `watch()`
- No manual save buttons
- Fixed header layouts (`h-screen` + `flex-shrink-0`)

## API Integration

The app supports three providers with automatic detection:

**Request Format:**
```javascript
// OpenAI
POST {endpoint}/chat/completions
Authorization: Bearer {token}
Body: { model, messages, stream }

// Anthropic
POST {endpoint}/messages
Authorization: Bearer {token}
anthropic-version: 2023-06-01
Body: { model, max_tokens, messages, system, stream }

// Gemini
POST {endpoint}/models/{model}:generateContent
Authorization: Bearer {token}
Body: { contents, systemInstruction, generationConfig }

// Image Generation
POST {endpoint}/images/generations
Authorization: Bearer {token}
Body: { prompt, model, size, quality, response_format: 'b64_json' }
```

**Provider Detection:** Automatically determined by `chatPath` pattern.

## Storage

- **localStorage** - API configuration (endpoint, model, token, provider, image settings)
- **IndexedDB (Dexie)** - Chat messages with model names (auto-save on change)
- **No Service Worker** - PWA uses plain manifest.json for installability only

## PWA Installation

1. Build: `npm run build`
2. Preview: `npm run preview`
3. On mobile: tap "Add to Home Screen"
4. App icon appears on home screen

**Note:** This PWA is installable but does not work offline (no service worker by design).

## Contributing

1. Use `<script setup>` syntax for all components
2. Use Composition API (not Options API)
3. Follow singleton pattern for shared state
4. Use auto-save instead of manual save buttons
5. Follow Tailwind utility-first approach
6. Match the warm, minimal design system

## License

MIT

## Acknowledgments

Built with Vue 3, Vite, and Tailwind CSS.
Co-Authored-By: Claude Opus 4.5
