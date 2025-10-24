# RoadSolSafe - Driver Trip Reward Program

A DePIN (Decentralized Physical Infrastructure Network) rewards platform for safer driving, built on Solana blockchain. This project combines a beautiful React Native mobile-first frontend with a robust Solana-integrated backend.

## 🎯 Project Overview

RoadSolSafe incentivizes safe driving through blockchain-based rewards. Drivers earn SOL tokens by completing safe trips, which are tracked through GPS and telemetry data. The platform features real-time trip monitoring, safety scoring, leaderboards, and seamless Solana wallet integration.

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RoadSolSafe Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Mobile Frontend │◄───────►│  Backend Server  │         │
│  │  (React Native)  │  REST   │  (Express.js)    │         │
│  └──────────────────┘   API   └──────────────────┘         │
│         │                              │                     │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Solana Wallet    │         │  Solana Program  │         │
│  │ (@solana/web3)   │◄───────►│  (Anchor/Rust)   │         │
│  └──────────────────┘         └──────────────────┘         │
│                                        │                     │
│                                        ▼                     │
│                              ┌──────────────────┐           │
│                              │ Solana Blockchain│           │
│                              │    (Devnet)      │           │
│                              └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend (`app/`)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs)
- **UI Components**: 
  - Custom components with gradient effects
  - Map integration with react-native-maps
  - Real-time trip monitoring
  - Safety score visualization
- **Wallet Integration**: Solana wallet-adapter (Phantom, Solflare, etc.)
- **Styling**: StyleSheet with dark theme, glassmorphism effects

#### Backend (`src/server/`)
- **Framework**: Express.js (Node.js)
- **Blockchain**: Solana Web3.js + Anchor
- **Database**: PostgreSQL (schema defined, ready for deployment)
- **Real-time Processing**: Kafka for telemetry data streams
- **Caching**: Redis for session management
- **Testing**: Jest + Supertest

#### Smart Contract (`programs/driver_trip_reward/`)
- **Language**: Rust
- **Framework**: Anchor Framework
- **Chain**: Solana (Devnet)
- **Features**: Trip verification, reward distribution, on-chain state management

## 📂 Project Structure

```
driver_trip_reward_program/
├── app/                          # React Native Frontend
│   ├── src/
│   │   ├── screens/              # Main app screens
│   │   │   ├── ProfileScreen.tsx        # Home/Dashboard with trip planning
│   │   │   ├── WalletScreen.tsx         # Solana wallet & rewards
│   │   │   ├── QuestsScreen.tsx         # Daily challenges
│   │   │   ├── LeaderboardScreen.tsx    # Rankings
│   │   │   ├── SocialsScreen.tsx        # Social features
│   │   │   └── OnboardingFlow.tsx       # First-time user experience
│   │   ├── components/           # Reusable UI components
│   │   │   ├── CustomTabBar.tsx         # Bottom navigation
│   │   │   ├── SafetyCluster.tsx        # Safety score gauge
│   │   │   ├── TripMonitoringModal.tsx  # Active trip tracking
│   │   │   └── GradientText.tsx         # Styled text components
│   │   ├── services/             # Business logic
│   │   │   ├── LocationSearchService.ts # Maps & geocoding
│   │   │   ├── DrivingCoach.ts          # Safety recommendations
│   │   │   └── TripMockService.ts       # Testing utilities
│   │   ├── styles/               # Theme & typography
│   │   └── config/               # Configuration files
│   ├── routes/                   # Route definitions
│   ├── solana/                   # Solana integration
│   └── root.tsx                  # App root component
│
├── src/server/                   # Backend API Server
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server initialization
│   ├── routes/                   # API endpoints
│   │   ├── session.ts            # Session management
│   │   ├── trip.ts               # Trip operations
│   │   ├── telemetry.ts          # Real-time data ingestion
│   │   ├── reward.ts             # Reward calculations
│   │   └── solana.ts             # Blockchain interactions
│   ├── controllers/              # Business logic
│   ├── services/                 # Core services
│   │   ├── solanaService.ts      # Blockchain communication
│   │   ├── rewardService.ts      # Reward calculations
│   │   ├── tripService.ts        # Trip processing
│   │   └── telemetryService.ts   # Data analysis
│   ├── database/                 # Database layer
│   │   ├── schema.ts             # PostgreSQL schema
│   │   └── migrations.ts         # Database migrations
│   └── middleware/               # Express middleware
│
├── programs/                     # Solana Smart Contracts
│   └── driver_trip_reward/
│       └── src/
│           └── lib.rs            # Anchor program (Rust)
│
├── simple-server.js              # Simplified test server
├── Anchor.toml                   # Anchor configuration
├── Cargo.toml                    # Rust dependencies
└── package.json                  # Node.js dependencies
```

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** v18+ and npm
- **Rust** 1.75+ (for Solana program development)
- **Solana CLI** 1.18+
- **Anchor** 0.32.1+
- **PostgreSQL** 14+ (optional, for production)
- **Redis** (optional, for production)

### Quick Start

1. **Clone the Repository**
   ```bash
   cd driver_trip_reward_program
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set Up Solana Wallet**
   
   The project includes a pre-configured development wallet at:
   - Address: `6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2`
   - Balance: ~2.3 SOL (Devnet)

   To get more devnet SOL:
   ```bash
   # Windows
   get_sol.bat

   # Linux/Mac
   ./get_sol.sh
   ```

4. **Start the Backend Server**
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:3000`

5. **Available API Endpoints**
   
   Once the server is running, you can access:
   - `GET http://localhost:3000/health` - Health check
   - `GET http://localhost:3000/solana/health` - Solana connection status
   - `POST http://localhost:3000/session/start` - Start trip session
   - `POST http://localhost:3000/telemetry` - Submit telemetry data
   - `POST http://localhost:3000/trip/finalize` - Finalize trip
   - `POST http://localhost:3000/solana/submit-trip` - Submit trip to blockchain
   - `GET http://localhost:3000/trip/summary/:tripId` - Get trip details

### Running the Mobile Frontend

The mobile frontend is currently integrated but requires React Native setup:

1. **Install Mobile Dependencies**
   ```bash
   cd app
   npm install
   ```

2. **Start Expo Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Emulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## 🎨 Key Features

### 1. **Trip Planning & Tracking**
- Interactive map with route planning
- Real-time GPS tracking
- Location search with autocomplete
- Integration with Google Maps, Apple Maps, and Waze

### 2. **Safety Monitoring**
- Real-time driving behavior analysis
- Safety score calculation (0-10 scale)
- Event detection:
  - Hard braking
  - Harsh acceleration
  - Sharp turns
  - Speeding
  - Phone usage

### 3. **Rewards System**
- SOL token rewards for safe driving
- Weekly payout epochs
- Points-based ranking system
- Leaderboard with global rankings

### 4. **Wallet Integration**
- Multiple Solana wallet support (Phantom, Solflare, Ledger)
- Real-time balance updates
- Transaction history
- One-click reward claims

### 5. **Social Features**
- Friend system
- Leaderboard rankings
- Achievement sharing

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=your_private_key_base58

# Server Configuration
PORT=3000
NODE_ENV=development

# Database (Optional for Production)
DATABASE_URL=postgresql://user:password@localhost:5432/roadsolsafe

# Redis (Optional for Production)
REDIS_URL=redis://localhost:6379

# API Keys (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Wallet Configuration

The development wallet is pre-configured in `app/src/config/devWallet.ts`:

```typescript
export const DEV_WALLET = {
  publicKey: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
  network: 'devnet',
  token: 'SOL',
  label: 'Dev Wallet'
};
```

## 📱 Frontend Architecture

### Component Hierarchy

```
App (root.tsx)
├── OnboardingFlow (first-time users)
└── NavigationContainer
    └── TabNavigator
        ├── ProfileScreen (Home)
        │   ├── SafetyCluster
        │   ├── MapView
        │   ├── TripMonitoringModal
        │   └── TripSummaryModal
        ├── WalletScreen
        │   ├── Balance Card
        │   ├── Wallet Connection
        │   └── Transaction History
        ├── QuestsScreen
        ├── LeaderboardScreen
        └── SocialsScreen
```

### State Management

Currently using React hooks (useState, useEffect) for local state. Key state includes:
- Trip session data
- User location
- Safety scores
- Wallet connection status
- Navigation state

### Styling System

- **Theme**: Dark mode with glassmorphism effects
- **Colors**: 
  - Primary: `#2D82FF` (Blue)
  - Secondary: `#FF6B35` (Orange)
  - Success: `#00D4FF` (Cyan)
  - Background: `#0F1419` to `#1F2A3A` (Gradient)
- **Typography**: Inter font family
- **Shadows**: Elevated cards with rgba shadows

## 🔐 Security Considerations

### Current Implementation
- Development wallet with limited SOL
- Devnet-only transactions
- No production secrets in code
- Environment-based configuration

### Production Recommendations
1. **Never commit private keys**
2. Use environment variables for all secrets
3. Implement proper authentication (JWT)
4. Add rate limiting on API endpoints
5. Use HTTPS for all communications
6. Implement transaction signing on client-side
7. Add multi-signature for large transactions

## 🧪 Testing

### Run Backend Tests
```bash
npm test
```

### Test Coverage
- Unit tests for services
- Integration tests for API endpoints
- Solana program tests (Anchor)

### Manual Testing
Use the provided test server:
```bash
npm run dev
```

Then test endpoints with curl or Postman:
```bash
# Health check
curl http://localhost:3000/health

# Solana health
curl http://localhost:3000/solana/health
```

## 📊 Data Flow

### Trip Lifecycle

```
1. User Opens App
   ↓
2. Plan Trip (select origin/destination)
   ↓
3. Start Trip → POST /session/start
   ↓
4. Real-time Telemetry → POST /telemetry (continuous)
   ↓
5. End Trip → POST /session/end
   ↓
6. Process Trip → POST /trip/finalize
   ↓
7. Submit to Blockchain → POST /solana/submit-trip
   ↓
8. Reward Calculation & Distribution
   ↓
9. Update Wallet Balance
```

## 🚧 Known Issues & Limitations

1. **Frontend Integration**: The React Router v7 integration requires additional configuration for Vite/SSR setup
2. **Database**: PostgreSQL schema is defined but not actively used (in-memory for now)
3. **Blockchain**: Smart contract needs deployment to devnet
4. **Maps API**: Requires Google Maps API key for production
5. **Authentication**: Currently using development mode (no auth)

## 🛣️ Roadmap

### Phase 1: Core Platform (Current)
- ✅ Basic trip tracking
- ✅ Safety scoring algorithm
- ✅ Solana wallet integration
- ✅ Frontend UI design
- ⏳ Backend API completion

### Phase 2: Production Ready
- Database integration (PostgreSQL)
- User authentication system
- Real-time telemetry processing (Kafka)
- Smart contract deployment
- API rate limiting & security

### Phase 3: Advanced Features
- Machine learning for behavior prediction
- Insurance integrations
- Fleet management dashboard
- Multi-chain support (Polygon, Ethereum)
- Social features expansion

## 📝 API Documentation

See [API_DOCS.md](./API_DOCS.md) for detailed endpoint documentation (coming soon).

## 🤝 Contributing

This is currently a development project. For contribution guidelines, please contact the project maintainers.

## 📄 License

[Add your license here]

## 📞 Support

For issues, questions, or feature requests, please contact:
- Email: [your-email]
- GitHub Issues: [repository-url]

## 🙏 Acknowledgments

- Solana Foundation for blockchain infrastructure
- Anchor Framework for smart contract development
- React Native & Expo teams
- Open source community

---

**Built with ❤️ for safer roads and decentralized rewards**
