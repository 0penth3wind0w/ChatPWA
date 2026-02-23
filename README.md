# ChatPWA

An elegant Progressive Web App for AI chat with custom API endpoints. Connect to OpenAI, Anthropic, Google Gemini, or any compatible API by configuring your endpoint URL, model name, and authentication token.

🚀 **Live:** [https://0penth3wind0w.github.io/ChatPWA/](https://0penth3wind0w.github.io/ChatPWA/)

## Features

- ✨ **Multi-Provider Support** - Works with OpenAI, Anthropic (Claude), and Google Gemini APIs
- 🎨 **Elegant Bubble Chat** - Left-aligned AI messages, right-aligned user messages with smooth animations
- 💬 **Slash Commands** - `/img`, `/search`, `/fetch` commands with autocomplete menu
- 🔍 **Web Search** - Integrated Brave Search and Tavily AI support
- 🌐 **Web Fetch** - Automatic URL content fetching via Jina AI Reader
- 🖼️ **Image Generation** - DALL-E integration with customizable settings
- 📝 **Markdown Support** - Full markdown rendering with code syntax highlighting
- 🎯 **Smart Typing Indicator** - Animated dots show when AI is responding
- 🛑 **Stop Generation** - Cancel ongoing requests with one click
- 💾 **Auto-Save Everything** - Messages and settings persist automatically (IndexedDB + localStorage)
- 🌍 **Internationalization** - Support for English, Traditional Chinese, French, and Japanese
- 🌓 **Dark Mode** - System preference detection with manual toggle
- 🎨 **Color Themes** - Choose from Green (Forest), Blue (Calm), or Slate (Professional) themes
- 🔒 **Privacy First** - All data stays on your device, no external tracking
- 📱 **Install as App** - Add to home screen for native-like experience
- ⚡ **Fast & Lightweight** - Built with Vue 3 + Vite + Tailwind CSS v4

## Tech Stack

- **Vue 3.5.28** - Composition API with `<script setup>` syntax
- **Vite 7.3.1** - Lightning-fast development and optimized builds
- **Tailwind CSS 4.2.0** - Custom design system via `@tailwindcss/vite` plugin
- **Vue I18n 11.2.8** - Internationalization support for 4 languages
- **Dexie 4.3.0** - IndexedDB wrapper for chat history persistence
- **Marked 17.0.3** - Markdown rendering in AI responses
- **Highlight.js 11.11.1** - Code syntax highlighting
- **DOMPurify 3.3.1** - XSS protection for user-generated content
- **Vite PWA Plugin 1.2.0** - Service worker with auto-update support
- **Jina AI Reader** - Web content extraction for URL fetching
- **Brave Search API** - Web search integration (optional)
- **Tavily AI API** - Web search integration (optional)

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/0penth3wind0w/ChatPWA.git
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

Type `/` to see available commands with autocomplete:

- **`/img [prompt]`** - Generate an image using DALL-E
  - Example: `/img a sunset over mountains`

- **`/search [query]`** - Search the web for information
  - Requires Brave Search or Tavily API key (configured in Settings)
  - Example: `/search latest Vue 3 features`

- **`/fetch [url]`** - Fetch and read web page content
  - Uses Jina AI Reader to convert web pages to clean markdown
  - Example: `/fetch https://example.com`

**Auto URL Detection:**
- Paste any URL in a regular message - the app automatically fetches and includes the content
- Supports multiple URLs in a single message

### Image Generation

1. Go to Settings → Image Generation
2. Configure:
   - **Image Model**: e.g., `dall-e-3`, `dall-e-2`
   - **Image Size**: 1024x1024 (Square), 1792x1024 (Landscape), 1024x1792 (Portrait)
   - **Image Quality**: Standard or HD (DALL-E 3 only)
   - **Aspect Ratio**: For Gemini models (1:1, 2:3, 3:2, 3:4, 4:3, etc.)
   - **Resolution**: 4K option for Gemini 3 Pro
3. Use `/img` command in chat
4. Images display directly in chat as base64

### Web Search

1. Go to Settings → Web Search
2. Choose a provider:
   - **Brave Search**: Requires Brave Search API key
   - **Tavily AI**: Requires Tavily API key
   - **Custom**: Use your own search endpoint
3. Enter your API key
4. Use `/search` command in chat

### Stop Generation

- Click the "Stop Generating" button that appears while the AI is responding
- Cancels the current request immediately
- Cancelled messages are automatically removed from chat history

### Settings

Click the ⚙️ icon in the chat header to access:

**AI Settings:**
- System Prompt: Customize AI behavior and personality
- Message History Limit: Control how many messages are sent to the API

**API Configuration:**
- API Format: OpenAI/Anthropic/Gemini
- Endpoint URL, model name, authentication token
- Custom chat/image paths

**Image Generation:**
- Image Model, Path, Size, Quality
- Aspect Ratio and Resolution (for Gemini)

**Web Search:**
- Search Provider: Brave/Tavily/Custom
- Search API Key configuration

**Appearance:**
- **Language**: English, Traditional Chinese, French, Japanese
- **Color Theme**: Green (Forest), Blue (Calm), Slate (Professional)
- **Dark Mode**: Toggle or use system preference

**About:**
- Connection Test: Verify your API configuration
- PWA Update: Check for app updates manually
- Version Information
- Source Code: Link to GitHub repository
- Clear Chat History: Delete all messages (cannot be undone)

All settings auto-save on change.

## Project Structure

```
ChatPWA/
├── src/
│   ├── components/
│   │   ├── ChatMessage.vue      # Bubble-style message with markdown
│   │   ├── MessageInput.vue     # Input with slash command autocomplete
│   │   ├── TypingIndicator.vue  # Animated typing dots
│   │   ├── EmptyState.vue       # Empty chat placeholder
│   │   ├── SettingsForm.vue     # Settings configuration form
│   │   ├── UpdatePrompt.vue     # PWA update notification
│   │   └── ErrorBoundary.vue    # Error handling component
│   ├── composables/
│   │   ├── useApi.js            # Multi-provider API client
│   │   ├── useChat.js           # Message state + IndexedDB
│   │   ├── useStorage.js        # Config persistence (singleton)
│   │   ├── useWebTools.js       # Web search and fetch utilities
│   │   ├── useDarkMode.js       # Dark mode state management
│   │   ├── useColorTheme.js     # Color theme management
│   │   └── useLocale.js         # Language switching
│   ├── i18n/
│   │   ├── index.js             # Vue I18n configuration
│   │   └── locales/             # Translation files (en, zh-TW, fr, ja)
│   ├── views/
│   │   ├── WelcomeView.vue      # Onboarding screen with GitHub link
│   │   ├── ChatView.vue         # Main chat with slash commands
│   │   └── SettingsView.vue     # Settings with GitHub link
│   ├── utils/
│   │   └── logger.js            # Logging utility
│   ├── style.css                # Tailwind v4 theme + animations
│   ├── App.vue                  # Root component with routing
│   └── main.js                  # Application entry point
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # App icons (192x192, 512x512)
├── CLAUDE.md                    # Development guidance
└── README.md                    # This file
```

## Design System

**Dynamic Color Themes:**

All color themes adapt to both light and dark modes:

- **Green (Forest)**: Natural, calming
  - Primary: `#3D8A5A`, Dark: `#4D9B6A`, Light: `#C8F0D8`
- **Blue (Calm)**: Muted, peaceful
  - Primary: `#5B8AA8`, Dark: `#6B9AB8`, Light: `#D4E8F3`
- **Slate (Professional)**: Neutral, modern
  - Primary: `#6B7F8C`, Dark: `#7B8F9C`, Light: `#D8DEE3`

**Base Colors:**
- Light Mode Background: `#F5F4F1` (warm cream)
- Dark Mode Background: `#1A1918` (near black)
- Surface: `#FFFFFF` (light) / `#2A2928` (dark)
- Text hierarchy: `#1A1918`, `#6D6C6A`, `#9C9B99` (light) / inverted (dark)

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
- Responsive dark mode with system preference detection

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
- Vue I18n Composition API for internationalization
- CSS custom properties for dynamic theming
- System preference detection (dark mode, language)

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

// Image Generation (OpenAI DALL-E)
POST {endpoint}/images/generations
Authorization: Bearer {token}
Body: { prompt, model, size, quality, response_format: 'b64_json' }

// Image Generation (Gemini)
POST {endpoint}/models/{model}:generateContent
Authorization: Bearer {token}
Body: { contents, generationConfig: { responseMimeType: 'image/png' } }
```

**Provider Detection:** Automatically determined by `chatPath` pattern.

**Web Tools Integration:**
```javascript
// Brave Search
GET https://api.search.brave.com/res/v1/web/search?q={query}
X-Subscription-Token: {apiKey}

// Tavily AI
POST https://api.tavily.com/search
Body: { api_key, query, search_depth, max_results }

// Jina AI Reader (Web Fetch)
GET https://r.jina.ai/{url}
Accept: text/plain
```

## Storage

- **localStorage** - API configuration, dark mode preference, color theme, and language preference
- **IndexedDB (Dexie)** - Chat messages with model names (auto-save on change)
- **Service Worker (Workbox)** - Auto-update mechanism with network-first caching for fonts

## PWA Installation

1. Build: `npm run build`
2. Preview: `npm run preview`
3. On mobile: tap "Add to Home Screen"
4. App icon appears on home screen

**Features:**
- Auto-update notifications when new versions are available
- Service worker with network-first caching strategy
- Optimized font loading (Google Fonts cached for 1 week)
- Immediate activation of new service worker versions

**Note:** This PWA requires an active internet connection to function. The service worker provides auto-update functionality and font caching (network-first strategy), but does not support full offline mode.

## Deploy to GitHub Pages

### Option 1: Using GitHub Actions (Recommended)

1. **Create deployment workflow file:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. **Enable GitHub Pages in repository settings:**
   - Go to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**

3. **Update base path in `vite.config.js`:**
   - Change `/ChatPWA/` to match your repository name
   - Format: `'/<repository-name>/'`

4. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push origin main
   ```

5. **Access your app:**
   - Visit `https://<username>.github.io/<repository-name>/`
   - Example: `https://0penth3wind0w.github.io/ChatPWA/`

### Option 2: Manual Deployment

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy dist folder:**
   ```bash
   cd dist
   git init
   git add -A
   git commit -m "Deploy to GitHub Pages"
   git push -f git@github.com:<username>/<repository>.git main:gh-pages
   ```

3. **Enable GitHub Pages:**
   - Go to **Settings** → **Pages**
   - Under **Source**, select branch `gh-pages` and folder `/ (root)`

4. **Access your app:**
   - Visit `https://<username>.github.io/<repository-name>/`

### Troubleshooting

- **404 errors:** Check that `base` in `vite.config.js` matches your repository name
- **Blank page:** Verify GitHub Pages is enabled and the correct branch is selected
- **CSS not loading:** Ensure `base` path includes the repository name with slashes: `'/repo-name/'`

## Development Guidelines

**Key Conventions:**
1. Use `<script setup>` syntax for all components
2. Use Composition API (not Options API)
3. Follow singleton pattern for shared state (module-level refs)
4. Use auto-save instead of manual save buttons
5. Add i18n translations for all user-facing text
6. Follow Tailwind utility-first approach
7. Match the warm, minimal design system
8. Use specialized tools over bash commands (Read, Edit, Write instead of cat, sed, echo)

## Recent Updates

**Version 1.0.3:**
- ✨ Complete i18n support for all UI text across 4 languages
- 🔍 Added web search integration (Brave Search, Tavily AI)
- 🌐 Added automatic URL content fetching with Jina AI Reader
- 🛑 Added stop generation button with proper message cleanup
- 🔗 Added GitHub repository link to Welcome and Settings pages
- 🎨 Enhanced slash command autocomplete menu
- 🐛 Fixed: Cancelled messages now properly removed from chat history
- 🐛 Fixed: Time formatting now respects user's selected language
- 🌍 All error messages and API responses now fully localized

## License

MIT

## Acknowledgments

Built with Vue 3, Vite, and Tailwind CSS.

Special thanks to:
- [Jina AI](https://jina.ai/) for the Reader API (web content extraction)
- [Brave Search](https://brave.com/search/api/) for web search capabilities
- [Tavily AI](https://tavily.com/) for AI-powered search

## Support

- 🐛 Report issues: [GitHub Issues](https://github.com/0penth3wind0w/ChatPWA/issues)
- 📖 Documentation: This README
- 💬 Discussions: [GitHub Discussions](https://github.com/0penth3wind0w/ChatPWA/discussions)
