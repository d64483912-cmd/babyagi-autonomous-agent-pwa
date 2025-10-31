# BabyAGI PWA - Development Setup Guide

This guide will help you set up the BabyAGI PWA project for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **pnpm** (recommended package manager)
  - Install globally: `npm install -g pnpm`
  - Verify installation: `pnpm --version`

Alternatively, you can use npm or yarn if you prefer.

## Initial Setup

### 1. Navigate to Project Directory

```bash
cd babyagi-pwa
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required dependencies including:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Framer Motion
- Vite PWA Plugin
- Radix UI components

### 3. Start Development Server

```bash
pnpm dev
```

The application will start on `http://localhost:5173`

## Development Workflow

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm build:prod` - Build with production optimizations
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint to check code quality
- `pnpm clean` - Clean node_modules and reinstall

### Project Structure Overview

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── ObjectiveInput.tsx # Create objectives
│   ├── TaskQueue.tsx    # Display tasks
│   └── ...
├── stores/             # Zustand state management
│   └── babyagiStore.ts # Main application state
├── lib/                # Business logic
│   ├── babyagiEngine.ts # Core simulation engine
│   └── ...
├── types/              # TypeScript definitions
│   └── babyagi.ts      # All type definitions
└── hooks/              # Custom React hooks
```

## Key Technologies

### State Management (Zustand)

The application uses Zustand for state management. Key store features:

```typescript
// Access store
const { objectives, addObjective } = useBabyAGIStore();

// Subscribe to changes
useBabyAGIStore.subscribe(
  (state) => state.simulation,
  (simulation) => {
    console.log('Simulation state changed:', simulation);
  }
);
```

### PWA Configuration

The app is configured with Vite PWA plugin:

- **Service Worker**: Automatically generated
- **Offline Support**: Configured via Workbox
- **App Manifest**: Defined in `vite.config.ts`
- **Auto Updates**: Enabled with `registerType: 'autoUpdate'`

### Styling (Tailwind CSS)

- Custom theme in `tailwind.config.js`
- Dark mode support
- Custom animations
- BabyAGI brand colors

### Animation (Framer Motion)

Used for smooth transitions and animations throughout the app:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

## Development Tips

### TypeScript

All files are fully typed. Key interfaces are defined in `src/types/babyagi.ts`:

- `Objective` - Defines objectives/tasks
- `Task` - Individual tasks
- `AgentMemory` - Learning and memory system
- `SimulationState` - Current simulation state

### Adding New Features

1. **New Components**: Add to `src/components/` and export in `index.ts`
2. **State Management**: Add actions to `src/stores/babyagiStore.ts`
3. **Types**: Define interfaces in `src/types/babyagi.ts`
4. **Engine Logic**: Extend `src/lib/babyagiEngine.ts`

### Environment Variables

Create a `.env` file for local development:

```env
# OpenRouter API (optional)
VITE_OPENROUTER_API_KEY=your_api_key_here

# Development settings
VITE_DEV_MODE=true
```

### Testing OpenRouter Integration

1. Get API key from [OpenRouter](https://openrouter.ai/)
2. Add to environment variables
3. Restart development server
4. Enable in Settings component

## Building for Production

### Standard Build

```bash
pnpm build
```

This creates optimized production files in the `dist/` directory.

### Production Build (Optimized)

```bash
pnpm build:prod
```

Includes additional optimizations and environment-specific settings.

### Preview Production Build

```bash
pnpm build
pnpm preview
```

Allows you to test the production build locally.

## PWA Installation

### Development

The app can be installed as a PWA during development:
1. Open in Chrome/Edge
2. Click install icon in address bar
3. Or use browser menu → "Install BabyAGI"

### Production

When deployed, the PWA will:
- Auto-register service worker
- Prompt for installation
- Work offline
- Auto-update when new versions available

## Troubleshooting

### Port Already in Use

If port 5173 is busy:
```bash
pnpm dev --port 3000
```

### Type Errors

Ensure TypeScript is working:
```bash
pnpm tsc --noEmit
```

### Dependency Issues

Clean install:
```bash
pnpm clean
pnpm install
```

### PWA Not Installing

Check browser console for service worker errors:
1. Open DevTools → Application → Service Workers
2. Ensure worker is registered
3. Check manifest validity

## Code Style

### ESLint

The project uses ESLint with React and TypeScript rules:

```bash
pnpm lint
```

### Prettier (Optional)

Add `.prettierrc` for consistent formatting:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Performance Optimization

### Bundle Analysis

Analyze bundle size:
```bash
pnpm build --mode analyze
```

### Code Splitting

Components are automatically code-split by Vite. Use dynamic imports for large components:

```typescript
const LazyComponent = lazy(() => import('./LargeComponent'));
```

### PWA Caching

Configure caching strategy in `vite.config.ts`:

```typescript
VitePWA({
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 300 }
        }
      }
    ]
  }
})
```

## Deployment

### Static Hosting

The built `dist/` folder can be deployed to any static host:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### PWA Requirements

Ensure your hosting supports:
- HTTPS (required for PWA)
- Service Workers
- Web App Manifest

## Contributing

1. Create feature branch
2. Make changes
3. Run linting: `pnpm lint`
4. Test build: `pnpm build`
5. Submit PR

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Radix UI Components](https://www.radix-ui.com/)

## Support

For development questions:
1. Check this guide
2. Review component code examples
3. Check TypeScript types
4. Open an issue on the repository

---

Happy coding! 🚀