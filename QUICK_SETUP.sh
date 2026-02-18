#!/bin/bash
# ChatPWA - Quick Setup Script
# Run this script to recreate the entire project setup from scratch

set -e  # Exit on error

echo "🚀 ChatPWA Setup Script"
echo "======================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Step 1: Create Vue 3 + Vite project
echo "📦 Step 1: Creating Vue 3 + Vite project..."
npm create vite@latest ChatPWA -- --template vue
cd ChatPWA

# Step 2: Install base dependencies
echo "📦 Step 2: Installing base dependencies..."
npm install

# Step 3: Install Tailwind CSS
echo "🎨 Step 3: Installing Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer

# Step 4: Install additional packages
echo "📦 Step 4: Installing additional packages..."
npm install dexie marked highlight.js
npm install -D vite-plugin-pwa

# Step 5: Create project structure
echo "📁 Step 5: Creating project structure..."
mkdir -p src/components src/views src/composables public/icons
touch src/components/{ChatMessage,MessageInput,SettingsForm,EmptyState,AppHeader}.vue
touch src/views/{WelcomeView,ChatView,SettingsView}.vue
touch src/composables/{useStorage,useChat,useApi}.js

# Step 6: Create Tailwind config
echo "⚙️  Step 6: Creating Tailwind configuration..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#F5F4F1',
        'bg-surface': '#FFFFFF',
        'bg-elevated': '#FAFAF8',
        'bg-muted': '#EDECEA',
        'text-primary': '#1A1918',
        'text-secondary': '#6D6C6A',
        'text-tertiary': '#9C9B99',
        'border-subtle': '#E5E4E1',
        'border-strong': '#D1D0CD',
        'forest-green': '#3D8A5A',
        'light-green': '#C8F0D8',
        'dark-green': '#4D9B6A',
        'warm-coral': '#D89575',
        'warm-red': '#D08068',
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
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'full': '100px',
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(26, 25, 24, 0.08)',
        'elevated': '0 2px 8px rgba(26, 25, 24, 0.08)',
        'subtle': '0 1px 6px rgba(26, 25, 24, 0.08)',
      },
    },
  },
  plugins: [],
}
EOF

# Step 7: Create PostCSS config
echo "⚙️  Step 7: Creating PostCSS configuration..."
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Step 8: Update main.css
echo "🎨 Step 8: Updating main.css with Tailwind directives..."
cat > src/assets/main.css << 'EOF'
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
  .btn-primary {
    @apply bg-forest-green text-white font-semibold rounded-md px-4 py-3 shadow-soft hover:bg-dark-green transition-colors;
  }

  .card {
    @apply bg-bg-surface rounded-lg shadow-soft p-5;
  }

  .input-field {
    @apply w-full h-12 bg-bg-elevated border border-border-subtle rounded-md px-4 text-base text-text-primary focus:border-forest-green focus:ring-2 focus:ring-forest-green focus:ring-opacity-20 outline-none transition-all;
  }
}
EOF

# Step 9: Update vite.config.js
echo "⚙️  Step 9: Updating Vite configuration with PWA plugin..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'ChatPWA',
        short_name: 'ChatPWA',
        description: 'AI Chat PWA with custom endpoints',
        theme_color: '#3D8A5A',
        background_color: '#F5F4F1',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Add app icons to public/icons/ (icon-192.png, icon-512.png)"
echo "  2. Run 'npm run dev' to start development server"
echo "  3. Follow IMPLEMENTATION_PLAN.md for development phases"
echo ""
echo "🚀 Happy coding!"
