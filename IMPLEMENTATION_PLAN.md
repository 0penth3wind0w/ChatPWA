# ChatPWA Implementation Plan

## Project Overview
A Progressive Web App (PWA) that allows users to configure custom AI endpoints and interact with various AI models through a chat interface.

## Core Features

### 1. Configuration Management
- **Endpoint Configuration**
  - API endpoint URL input with validation
  - Model name/ID selection or custom input
  - Authentication token secure storage
  - Configuration persistence using localStorage/IndexedDB
  - Support for multiple endpoint profiles (optional for future enhancement)

### 2. Chat Interface
- **UI Components**
  - Message list with auto-scroll
  - Message input area with multi-line support
  - Send button and keyboard shortcuts (Enter to send)
  - Loading indicators during API calls
  - Error message display
  - Message history display (user/assistant messages)

- **Functionality**
  - Real-time message streaming (if API supports SSE/streaming)
  - Message history persistence
  - Clear conversation option
  - Copy message content
  - Markdown rendering for formatted responses

### 3. PWA Capabilities
- **Service Worker**
  - Offline fallback page
  - Asset caching strategy
  - API response caching (optional)

- **Manifest Configuration**
  - App name and description
  - Icons (192x192, 512x512)
  - Theme colors
  - Display mode (standalone)
  - Start URL

- **Installation**
  - Install prompt handling
  - Add to home screen capability
  - Splash screen configuration

## Technical Stack

### Frontend Framework
- **Vue.js 3** - Lightweight, reactive, and easy to learn
- **Composition API** - Modern Vue approach for better code organization
- **Vue Router** - For navigation between screens (optional for single-page flow)

### Build Tool
- **Vite** - Fast development server and optimized builds
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds with code splitting

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- Custom configuration matching UI mockup design system
- Design tokens: warm cream palette (#F5F4F1), forest green (#3D8A5A)
- Custom shadows, border radius, and typography (Outfit font)
- Responsive design (mobile-first approach)
- Dark/light theme support via Tailwind (optional)
- PostCSS for CSS processing

### Storage
- **localStorage** - Configuration and settings
- **IndexedDB** - Chat history and larger data (via localforage or Dexie.js)
- **sessionStorage** - Temporary session data

### API Integration
- **Fetch API** - Native browser API for HTTP requests
- Support for streaming responses (Server-Sent Events or chunked transfer)
- Error handling and retry logic
- Request/response interceptors

## Project Structure (Vue 3 + Vite + Tailwind)

```
ChatPWA/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/
│       ├── icon-192.png        # App icon 192x192
│       └── icon-512.png        # App icon 512x512
├── src/
│   ├── assets/
│   │   └── main.css            # Tailwind directives and global styles
│   ├── components/
│   │   ├── ChatMessage.vue     # Message bubble component
│   │   ├── MessageInput.vue    # Input area with send button
│   │   ├── SettingsForm.vue    # API configuration form
│   │   ├── EmptyState.vue      # Empty conversation state
│   │   └── AppHeader.vue       # Header with title and buttons
│   ├── composables/
│   │   ├── useStorage.js       # localStorage/IndexedDB utilities
│   │   ├── useChat.js          # Chat state and logic
│   │   └── useApi.js           # API client logic
│   ├── views/
│   │   ├── WelcomeView.vue     # Welcome/onboarding screen
│   │   ├── ChatView.vue        # Main chat interface
│   │   └── SettingsView.vue    # Settings screen
│   ├── App.vue                 # Root component
│   └── main.js                 # Application entry point
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration (custom design tokens)
├── postcss.config.js           # PostCSS configuration
├── package.json                # Dependencies and scripts
└── README.md                   # Project documentation
```

## Implementation Phases

### Phase 1: Project Setup & Basic Structure
- [ ] Initialize Vue 3 project with Vite (`npm create vite@latest`)
- [ ] Install Tailwind CSS and dependencies
- [ ] Configure Tailwind with custom design tokens from UI mockup
- [ ] Set up Tailwind directives in main.css
- [ ] Configure custom colors (cream, forest-green, warm-coral)
- [ ] Configure custom shadows (soft shadows with 8% opacity)
- [ ] Configure custom border radius (12px, 16px, 100px)
- [ ] Add Outfit font family to Tailwind config
- [ ] Set up project structure (components, views, composables)
- [ ] Implement responsive design foundation (mobile-first)

### Phase 2: Configuration Module
- [ ] Create SettingsView.vue component
- [ ] Build SettingsForm.vue with three input fields (endpoint, model, token)
- [ ] Implement form validation for endpoint URL (regex/URL validation)
- [ ] Add secure token input with masking (password field)
- [ ] Create useStorage composable for localStorage operations
- [ ] Implement configuration save/load functionality
- [ ] Add configuration validation logic and error messages
- [ ] Create connection test functionality

### Phase 3: Chat Interface
- [ ] Create ChatView.vue as main chat screen
- [ ] Build ChatMessage.vue component (AI/user differentiation)
- [ ] Style message bubbles (white for AI, green for user)
- [ ] Create MessageInput.vue with textarea and send button
- [ ] Implement auto-scroll on new messages (ref + scrollIntoView)
- [ ] Add message timestamp display (optional)
- [ ] Create EmptyState.vue component for new conversations
- [ ] Add loading states and animations (spinner during API calls)
- [ ] Implement AppHeader.vue with title and settings button

### Phase 4: API Integration
- [ ] Create useApi composable for API communication
- [ ] Implement request builder with custom endpoint/model/token
- [ ] Build sendMessage function using Fetch API
- [ ] Add error handling with user-friendly error messages
- [ ] Implement streaming support using ReadableStream (if applicable)
- [ ] Add request timeout and retry logic
- [ ] Handle rate limiting and API error responses
- [ ] Create reactive state for loading/error states

### Phase 5: Message Persistence
- [ ] Create useChat composable for chat state management
- [ ] Implement IndexedDB schema for messages (consider using Dexie.js)
- [ ] Create save/load chat history functions
- [ ] Add reactive messages array with Vue's ref/reactive
- [ ] Implement clear history functionality
- [ ] Add conversation export (JSON/Markdown - optional)
- [ ] Implement conversation search/filter (optional)

### Phase 6: PWA Features
- [ ] Create manifest.json in public/ folder
- [ ] Configure app name, description, and theme colors
- [ ] Design and add app icons (192x192, 512x512)
- [ ] Implement service worker (sw.js) with caching strategy
- [ ] Use Workbox or manual service worker registration
- [ ] Configure Vite for PWA build (vite-plugin-pwa)
- [ ] Add offline detection and fallback UI
- [ ] Implement install prompt handling
- [ ] Test PWA installation on mobile devices (iOS/Android)

### Phase 7: Enhanced Features
- [ ] Add markdown rendering for AI responses (use marked.js or markdown-it)
- [ ] Implement code syntax highlighting (use highlight.js or Prism)
- [ ] Add copy-to-clipboard for messages (use Clipboard API)
- [ ] Create dark/light theme toggle (CSS variables + localStorage)
- [ ] Add keyboard shortcuts (Enter to send, Shift+Enter for new line)
- [ ] Implement conversation management (new/delete/rename)
- [ ] Add message editing/regeneration features

### Phase 8: Testing & Optimization
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing
- [ ] PWA audit using Lighthouse
- [ ] Performance optimization
- [ ] Security review (token storage, XSS prevention)
- [ ] Accessibility testing (WCAG compliance)

### Phase 9: Documentation & Deployment
- [ ] Write user documentation
- [ ] Create developer documentation
- [ ] Set up deployment (GitHub Pages, Netlify, Vercel, etc.)
- [ ] Configure HTTPS (required for PWA)
- [ ] Add error monitoring (optional)

## Security Considerations

### Token Storage
- Store auth tokens in localStorage with encryption consideration
- Never log or expose tokens in console/network tab
- Implement token masking in UI
- Add token validation before storage

### API Communication
- Use HTTPS for all API requests
- Implement CORS handling
- Validate and sanitize all user inputs
- Prevent XSS attacks in message rendering
- Implement rate limiting on client side

### Data Privacy
- Keep all data local (no third-party tracking)
- Provide clear data deletion options
- No server-side storage of conversations
- Transparent about data usage

## API Compatibility

### Expected API Format
The application should support OpenAI-compatible APIs with the following request format:

```json
POST {endpoint_url}
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "model": "{model_name}",
  "messages": [
    {"role": "user", "content": "message"}
  ],
  "stream": true/false
}
```

### Adaptability
- Make API format configurable if needed
- Support different authentication methods (Bearer, API-Key, etc.)
- Handle various response formats
- Graceful degradation for unsupported features

## User Experience Considerations

### First-Time User Flow
1. Welcome screen with setup instructions
2. Configuration form with helpful tooltips
3. Test connection button to verify settings
4. Success confirmation before proceeding to chat

### Error Handling
- Clear error messages for connection failures
- Suggestions for common configuration mistakes
- Retry mechanisms with user control
- Network status indicators

### Performance
- Lazy loading of chat history
- Efficient DOM updates
- Debounced input handlers
- Optimized bundle size

## Tailwind Component Examples

### ChatMessage Component (AI Message)
```vue
<template>
  <div class="w-full p-4 bg-bg-surface rounded-lg shadow-soft">
    <p class="text-xs font-semibold text-forest-green mb-2">AI Assistant</p>
    <p class="text-base text-text-primary leading-relaxed">
      {{ message }}
    </p>
  </div>
</template>
```

### ChatMessage Component (User Message)
```vue
<template>
  <div class="w-full p-4 bg-forest-green rounded-lg shadow-soft">
    <p class="text-xs font-semibold text-white mb-2">You</p>
    <p class="text-base text-white leading-relaxed">
      {{ message }}
    </p>
  </div>
</template>
```

### MessageInput Component
```vue
<template>
  <div class="flex items-center gap-3 w-full h-14 bg-bg-surface rounded-md shadow-soft px-4">
    <input
      type="text"
      placeholder="Type your message..."
      class="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
      v-model="message"
      @keydown.enter="sendMessage"
    />
    <button
      class="w-9 h-9 bg-forest-green rounded-full flex items-center justify-center hover:bg-dark-green transition-colors"
      @click="sendMessage"
    >
      <svg class="w-4.5 h-4.5 text-white"><!-- Send icon --></svg>
    </button>
  </div>
</template>
```

### Settings Form Input
```vue
<template>
  <div class="w-full space-y-2">
    <label class="text-sm font-medium text-text-secondary">
      API Endpoint URL
    </label>
    <input
      type="url"
      placeholder="https://api.example.com/v1/chat"
      class="input-field focus:border-forest-green focus:ring-2 focus:ring-forest-green focus:ring-opacity-20 outline-none transition-all"
      v-model="endpoint"
    />
  </div>
</template>
```

### Primary Button
```vue
<template>
  <button class="btn-primary w-full h-13">
    Save Configuration
  </button>
</template>
```

### Header Component
```vue
<template>
  <header class="flex items-center justify-between w-full">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold text-text-primary -tracking-tight">
        AI Chat
      </h1>
      <p class="text-sm font-medium text-forest-green">Connected</p>
    </div>
    <button class="w-11 h-11 bg-bg-surface rounded-full shadow-elevated flex items-center justify-center hover:bg-bg-elevated transition-colors">
      <svg class="w-5 h-5 text-text-secondary"><!-- Settings icon --></svg>
    </button>
  </header>
</template>
```

## Future Enhancements
- Multiple conversation threads
- Conversation search and filtering
- Export conversations (JSON, Markdown, PDF)
- Custom system prompts
- Temperature and other model parameters
- Voice input/output
- Image support (if API supports)
- Plugins/extensions system
- Multi-language support
- Conversation templates

## Success Metrics
- PWA installability score: 100% on Lighthouse
- Performance score: >90 on Lighthouse
- Accessibility score: >90 on Lighthouse
- Works offline with appropriate fallbacks
- Responsive on all screen sizes (320px+)
- Fast initial load (<3 seconds)
- Smooth message sending/receiving experience

## Timeline Estimate
- **MVP (Phases 1-6)**: Foundation with core features
- **Enhanced Version (Phases 7-8)**: Polish and optimization
- **Production Ready (Phase 9)**: Documentation and deployment

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Code editor (VS Code recommended)
- Browser with dev tools

### Initial Setup Commands
```bash
# Create Vue 3 + Vite project
npm create vite@latest ChatPWA -- --template vue

# Navigate to project
cd ChatPWA

# Install dependencies
npm install

# Install Tailwind CSS and dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional packages
npm install dexie              # IndexedDB wrapper
npm install marked             # Markdown rendering
npm install highlight.js       # Code syntax highlighting
npm install vite-plugin-pwa -D # PWA plugin for Vite

# Start development server
npm run dev

# Build for production
npm run build
```

### Development Workflow
1. Set up project structure following Vue 3 best practices
2. Create reusable composables for business logic
3. Build components based on UI mockup (UI.pen)
4. Follow implementation phases sequentially
5. Test frequently on target devices
6. Iterate based on user feedback

### Design Reference
- UI mockup available in `UI.pen` (view with Pencil)
- Three screens: Welcome, Chat, Settings
- Color palette: Warm cream (#F5F4F1), Forest green (#3D8A5A)
- Typography: Outfit font family
- Design: Soft shadows, rounded corners (12-16px)

### Tailwind Configuration (tailwind.config.js)

Configure Tailwind to match the UI mockup design system:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#F5F4F1',      // Warm cream
        'bg-surface': '#FFFFFF',       // White cards
        'bg-elevated': '#FAFAF8',      // Slightly warm white
        'bg-muted': '#EDECEA',         // Warm gray

        // Text
        'text-primary': '#1A1918',     // Headlines, primary content
        'text-secondary': '#6D6C6A',   // Body text, descriptions
        'text-tertiary': '#9C9B99',    // Labels, placeholders

        // Borders
        'border-subtle': '#E5E4E1',    // Card borders, dividers
        'border-strong': '#D1D0CD',    // Form controls

        // Accent colors
        'forest-green': '#3D8A5A',     // Primary green
        'light-green': '#C8F0D8',      // Progress backgrounds
        'dark-green': '#4D9B6A',       // Success states
        'warm-coral': '#D89575',       // Secondary accent
        'warm-red': '#D08068',         // Warnings
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '15px',
        'lg': '18px',
        'xl': '22px',
        '2xl': '26px',
        '3xl': '32px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',     // Inputs, buttons
        'lg': '16px',     // Cards
        'xl': '20px',
        'full': '100px',  // Circular buttons
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(26, 25, 24, 0.08)',
        'elevated': '0 2px 8px rgba(26, 25, 24, 0.08)',
        'subtle': '0 1px 6px rgba(26, 25, 24, 0.08)',
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
      },
    },
  },
  plugins: [],
}
```

### Tailwind Main CSS (src/assets/main.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-outfit text-base text-text-primary bg-bg-primary;
  }
}

@layer components {
  /* Custom component classes if needed */
  .btn-primary {
    @apply bg-forest-green text-white font-semibold rounded-md px-4 py-3 shadow-soft hover:bg-dark-green transition-colors;
  }

  .card {
    @apply bg-bg-surface rounded-lg shadow-soft p-5;
  }

  .input-field {
    @apply w-full h-12 bg-bg-elevated border border-border-subtle rounded-md px-4 text-base text-text-primary;
  }
}
```

---

**Note**: This plan is flexible and can be adjusted based on specific requirements, chosen technologies, and available resources. Prioritize core functionality (Phases 1-6) before moving to enhanced features.
