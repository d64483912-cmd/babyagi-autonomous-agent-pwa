# BabyAGI PWA - Autonomous AI Agent Simulator

A Progressive Web Application (PWA) that simulates autonomous AI agent behavior based on the BabyAGI framework. This interactive application demonstrates how AI agents can autonomously break down objectives into tasks, execute them, learn from results, and adapt their strategies.

## Features

- 🚀 **Real-time Simulation** - Watch AI agents autonomously execute tasks
- 📱 **Progressive Web App** - Install on mobile and desktop devices
- 🧠 **Agent Memory System** - Agents learn and adapt from experience
- ⚡ **Real AI Integration** - Optional OpenRouter API integration for actual AI responses
- 📊 **Analytics Dashboard** - Track performance and learning metrics
- 🎨 **Modern UI** - Built with Tailwind CSS and Framer Motion animations
- 🔧 **Customizable Settings** - Control simulation speed, iteration limits, and more

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **PWA**: Vite PWA Plugin + Workbox
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Project Structure

```
babyagi-pwa/
├── public/
│   ├── pwa-192x192.png          # PWA icons
│   └── pwa-512x512.png
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── ObjectiveInput.tsx  # Create objectives
│   │   ├── TaskQueue.tsx       # Display and manage tasks
│   │   ├── AgentMemory.tsx     # Agent learning memory
│   │   ├── StatisticsPanel.tsx # Performance analytics
│   │   ├── ExecutionMonitor.tsx# Real-time execution
│   │   ├── Settings.tsx        # App configuration
│   │   ├── ErrorBoundary.tsx   # Error handling
│   │   └── index.ts            # Component exports
│   ├── stores/                 # Zustand state management
│   │   └── babyagiStore.ts     # Main app state
│   ├── lib/                    # Core business logic
│   │   ├── babyagiEngine.ts    # BabyAGI simulation engine
│   │   ├── enhancedBabyAGIEngine.ts # Advanced features
│   │   ├── openRouterService.ts # OpenRouter API integration
│   │   └── utils.ts            # Utility functions
│   ├── types/                  # TypeScript type definitions
│   │   └── babyagi.ts          # All app types
│   ├── hooks/                  # Custom React hooks
│   │   └── use-mobile.tsx      # Mobile detection
│   ├── App.tsx                 # Root component
│   ├── main.tsx               # App entry point
│   ├── index.css              # Global styles
│   └── vite-env.d.ts          # Vite type definitions
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Vite + PWA configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── eslint.config.js          # ESLint rules
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd babyagi-pwa
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:prod` - Build for production (optimized)
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm clean` - Clean node_modules and lock file

## Configuration

### PWA Setup

The app is configured as a Progressive Web App with:
- Service worker for offline functionality
- Web app manifest for installation
- Automatic updates
- Mobile-optimized interface

### Tailwind CSS

Custom theme with:
- BabyAGI brand colors
- Dark mode support
- Custom animations
- Responsive design utilities

### OpenRouter Integration (Optional)

To enable real AI responses:

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Go to Settings in the app
3. Enter your API key and select a model
4. Enable "Use OpenRouter" toggle

**Note**: Costs may apply. The app will fall back to simulation if the API is unavailable.

## Usage

### Basic Workflow

1. **Create an Objective**: Define what you want the AI agent to accomplish
2. **Start Simulation**: Watch as the agent breaks down your objective into tasks
3. **Monitor Execution**: Track task progress and agent learning
4. **Analyze Results**: Review statistics and memory insights
5. **Iterate**: Create new objectives based on learnings

### Features

- **Task Decomposition**: Agents automatically break complex objectives into manageable tasks
- **Dependency Management**: Tasks can depend on other tasks being completed first
- **Learning System**: Agents remember successful strategies and apply them to future tasks
- **Real-time Monitoring**: Watch simulations unfold with live updates
- **Performance Analytics**: Track efficiency, completion rates, and learning progress

## Architecture

### State Management (Zustand)

The app uses Zustand for lightweight, performant state management:

```typescript
// Example store usage
const { objectives, addObjective, startSimulation } = useBabyAGIStore();

// Subscribe to changes
useBabyAGIStore.subscribe(
  (state) => state.simulation,
  (simulation) => {
    // React to simulation state changes
  }
);
```

### BabyAGI Engine

The core simulation engine handles:
- Objective decomposition
- Task execution
- Learning and memory management
- Strategy adaptation

### Type Safety

Full TypeScript coverage with comprehensive interfaces for:
- Objectives and tasks
- Agent memory
- Simulation state
- Settings and configuration
- API responses

## PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Works without internet connection
- **Auto-updates**: Seamless updates in the background
- **App-like Experience**: Full-screen mode, native-like UI

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with PWA support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the original [BabyAGI](https://github.com/yoheinakajima/babyagi) project
- Built with modern web technologies for optimal performance and user experience
- Designed as an educational tool to understand autonomous AI agent behavior

## Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.

---

**Note**: This is a simulation and educational tool. While it demonstrates autonomous AI agent principles, it should not be considered production-ready for critical applications without thorough testing and validation.