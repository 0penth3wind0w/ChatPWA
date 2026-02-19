# ChatPWA

A Progressive Web App for AI chat with custom API endpoints. Connect to any AI model by configuring your own endpoint URL, model name, and authentication token.

![ChatPWA](UI.pen)

## Features

✨ **Custom API Endpoints** - Use any AI provider or self-hosted model
🔒 **Secure & Private** - All data stays on your device
📱 **Progressive Web App** - Install on mobile devices for offline access
💬 **Clean Chat Interface** - Soft, comfortable design for extended conversations
⚡ **Fast & Lightweight** - Built with Vue 3 + Vite + Tailwind CSS

## Tech Stack

- **Vue 3.5.28** - Composition API with `<script setup>` syntax
- **Vite 7.3.1** - Lightning-fast development and optimized builds
- **Tailwind CSS 4.2.0** - Custom design system (warm cream palette, soft shadows)
- **PWA Support** - Service worker with Workbox for offline functionality
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

**Note:** PWA features (service worker, install prompt) only work in production builds or over HTTPS.

## Usage

### First Time Setup

1. Launch the app - you'll see the Welcome screen
2. Click "Get Started" to configure your API
3. Enter your API endpoint URL (e.g., `https://api.example.com/v1/chat`)
4. Enter your model name (e.g., `gpt-4`)
5. Enter your authentication token
6. Click "Save Configuration"

### Chatting

1. Once configured, you'll be taken to the chat screen
2. Type your message in the input field at the bottom
3. Press Enter to send (or Shift+Enter for new line)
4. Your messages appear in green, AI responses in white

### Settings

- Click the settings icon (⚙️) in the chat header to modify your configuration
- You can update endpoint, model, or token at any time
- Use "Clear Chat History" to delete all conversation messages

## Project Structure

```
ChatPWA/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AppHeader.vue    # Header with navigation
│   │   ├── ChatMessage.vue  # Message bubble (AI/user)
│   │   ├── EmptyState.vue   # Empty conversation placeholder
│   │   ├── MessageInput.vue # Input field with send button
│   │   └── SettingsForm.vue # API configuration form
│   ├── composables/         # Business logic
│   │   ├── useApi.js        # API client (to be implemented)
│   │   ├── useChat.js       # Chat state management
│   │   └── useStorage.js    # localStorage/IndexedDB utilities
│   ├── views/               # Page-level components
│   │   ├── ChatView.vue     # Main chat interface
│   │   ├── SettingsView.vue # Settings screen
│   │   └── WelcomeView.vue  # Welcome/onboarding screen
│   ├── assets/
│   │   └── main.css         # Tailwind + custom styles
│   ├── App.vue              # Root component with routing
│   └── main.js              # Application entry point
├── public/
│   └── icons/               # PWA icons (192x192, 512x512)
├── CLAUDE.md                # Guidance for Claude Code
├── IMPLEMENTATION_PLAN.md   # Full development roadmap
└── UI.pen                   # UI design mockup
```

## Development

### Design System

The app uses a custom Tailwind configuration with a warm, minimal aesthetic:

**Colors:**
- Background: `#F5F4F1` (warm cream)
- Primary: `#3D8A5A` (forest green)
- Text: `#1A1918`, `#6D6C6A`, `#9C9B99` (hierarchy)

**Typography:**
- Font: Outfit (400, 500, 600, 700)
- Sizes: 12px - 32px

**Shadows:**
- Soft shadows with 8% opacity for comfortable viewing

See `tailwind.config.js` and `UI.pen` for complete design reference.

### Architecture

The app follows a three-layer architecture:

1. **Views** - Page-level components (Welcome, Chat, Settings)
2. **Components** - Reusable UI elements
3. **Composables** - Business logic and state management

Data flows from user input → Views → Composables → Storage/API

### Current Implementation Status

- ✅ **Phase 1:** Project Setup & Basic Structure
- ✅ **Phase 2:** Configuration Module
- ✅ **Phase 3:** Chat Interface
- 🔜 **Phase 4:** API Integration (next)
- 📋 **Phase 5:** Message Persistence
- 📋 **Phase 6:** PWA Features
- 📋 **Phase 7:** Enhanced Features
- 📋 **Phase 8:** Testing & Optimization
- 📋 **Phase 9:** Documentation & Deployment

See `IMPLEMENTATION_PLAN.md` for detailed roadmap.

## API Integration

The app expects OpenAI-compatible APIs:

```http
POST {your-endpoint}
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "model": "{your-model}",
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}
```

Currently using simulated responses. Actual API integration will be implemented in Phase 4.

## PWA Installation

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. On mobile, tap "Add to Home Screen"
4. App will work offline with cached assets

## Storage

- **localStorage** - API configuration (endpoint, model, token)
- **IndexedDB** - Chat history (to be implemented)
- **Service Worker Cache** - Static assets, Google Fonts

## Contributing

1. Follow the Vue 3 Composition API conventions
2. Use `<script setup>` syntax for all components
3. Follow Tailwind utility-first approach
4. Match the design system in `tailwind.config.js`
5. Make incremental commits with clear messages

## Documentation

- `CLAUDE.md` - Guidance for Claude Code
- `IMPLEMENTATION_PLAN.md` - Complete development plan
- `SETUP_COMMANDS.md` - Detailed setup instructions
- `SETUP_SUMMARY.md` - Quick overview
- `UI.pen` - UI design mockup

## License

MIT

## Acknowledgments

Built with Vue 3, Vite, and Tailwind CSS.
Co-Authored-By: Claude Sonnet 4.5
