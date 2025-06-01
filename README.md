# League of Legends Smurf Detection Tool

A comprehensive web application that analyzes League of Legends player behavior patterns to detect potential smurf accounts. Built for tournament organizers and competitive integrity.

## 🎯 Project Overview

This tool helps tournament organizers and community administrators identify potential smurf accounts by analyzing:
- Champion performance patterns
- Playtime gaps and activity patterns
- Summoner spell usage changes
- Player association networks
- Skill progression anomalies

## 🚀 Features

### Core Detection Algorithms
- **Champion Performance Analysis**: Detects unusually high performance on low-playtime champions
- **Playtime Gap Detection**: Identifies suspicious gaps in gameplay activity
- **Summoner Spell Pattern Analysis**: Tracks changes in spell placement and usage
- **Player Association Mapping**: Analyzes connections with high-ELO players
- **Skill Progression Monitoring**: Detects unnatural skill improvements

### User Interface
- Modern, responsive web interface
- Real-time analysis with progress indicators
- Color-coded probability indicators
- Detailed breakdown of detection factors
- Mobile-friendly design

### Technical Features
- TypeScript for type safety
- Comprehensive test coverage
- Rate limiting and caching
- Error handling and retry logic
- Configurable detection thresholds

## 🛠️ Technology Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for API endpoints
- **RiotWatcher** for Riot API integration
- **Jest** for testing
- **Winston** for logging

### Frontend
- **React** with TypeScript
- **Axios** for API communication
- **CSS3** with modern styling
- **Responsive design**

### Infrastructure
- **SQLite/PostgreSQL** for data storage
- **Redis** for caching (optional)
- **Docker** support (planned)

## 📋 Prerequisites

- Node.js 16+ and npm
- Riot Games API key (Development or Production)
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd league-smurf-detector
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Riot API Configuration
RIOT_API_KEY=your_riot_api_key_here
RIOT_API_BASE_URL=https://americas.api.riotgames.com

# Server Configuration
PORT=3001
HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Smurf Detection Thresholds
SMURF_WIN_RATE_THRESHOLD=0.7
SMURF_KDA_THRESHOLD=3.0
SMURF_CS_THRESHOLD=8.0
SMURF_GAP_HOURS=168

# Detection Algorithm Weights
SMURF_WEIGHT_GAPS=0.25
SMURF_WEIGHT_PERFORMANCE=0.35
SMURF_WEIGHT_SPELLS=0.15
SMURF_WEIGHT_ASSOCIATIONS=0.15
SMURF_WEIGHT_PROGRESSION=0.10

# Caching (Optional)
CACHE_ENABLED=true
CACHE_PROVIDER=memory
CACHE_TTL_SUMMONER=300
CACHE_TTL_MATCH=86400

# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
```

### 4. Get a Riot API Key

#### Development Key (Immediate)
1. Visit [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in with your Riot account
3. Generate a development key (24-hour expiration)
4. Add it to your `.env` file

#### Production Key (For Public Use)
1. Apply for a production key at the developer portal
2. Provide a working website/application
3. Include Terms of Service and Privacy Policy
4. Wait for approval (can take several days)

### 5. Start the Application

#### Development Mode
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

#### Production Mode
```bash
# Build frontend
cd frontend
npm run build
cd ..

# Start production server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎮 Usage

### Basic Analysis
1. Open the web application
2. Enter a player name in the format: `PlayerName#TAG`
3. Click "Analyze Player"
4. Review the smurf probability and detailed analysis

### Understanding Results

#### Probability Levels
- **Very Low (0-20%)**: Legitimate player
- **Low (20-40%)**: Minimal suspicion
- **Moderate (40-60%)**: Some suspicious patterns
- **High (60-80%)**: Likely smurf account
- **Very High (80-100%)**: Strong smurf indicators

#### Detection Factors
- **Champion Performance**: High win rates on new champions
- **Playtime Gaps**: Long periods of inactivity
- **Summoner Spells**: Changes in spell placement patterns
- **Player Associations**: Games with high-ELO players

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Backend tests only
npm run test:backend

# Frontend tests only
cd frontend
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📊 API Documentation

### Analyze Player
```http
POST /api/analyze
Content-Type: application/json

{
  "playerName": "PlayerName#TAG",
  "region": "na1",
  "gameCount": 50
}
```

### Get Player Info
```http
GET /api/player/{region}/{playerName}
```

### Health Check
```http
GET /api/health
```

## ⚙️ Configuration

### Detection Thresholds
Adjust sensitivity in `.env`:
- `SMURF_WIN_RATE_THRESHOLD`: Win rate threshold (0.0-1.0)
- `SMURF_KDA_THRESHOLD`: KDA threshold
- `SMURF_CS_THRESHOLD`: CS per minute threshold
- `SMURF_GAP_HOURS`: Suspicious gap duration in hours

### Algorithm Weights
Fine-tune detection factors:
- `SMURF_WEIGHT_GAPS`: Playtime gap importance
- `SMURF_WEIGHT_PERFORMANCE`: Champion performance importance
- `SMURF_WEIGHT_SPELLS`: Summoner spell pattern importance
- `SMURF_WEIGHT_ASSOCIATIONS`: Player association importance
- `SMURF_WEIGHT_PROGRESSION`: Skill progression importance

**Note**: All weights must sum to 1.0

## 🚨 Rate Limiting & API Guidelines

### Development Key Limits
- 20 requests per second
- 100 requests per 2 minutes

### Production Key Limits
- 500 requests per 10 seconds
- 30,000 requests per 10 minutes

### Best Practices
- Implement caching for repeated requests
- Use appropriate retry logic with exponential backoff
- Monitor rate limit headers
- Cache match data for 24 hours maximum (Riot requirement)

## 🔒 Data Privacy & Compliance

### Riot API Terms
- Match data must be deleted after 24 hours
- Only aggregate statistics can be stored long-term
- Personal information cannot be stored
- Must respect player privacy

### GDPR Compliance
- No personal data storage
- Data processing for legitimate interests only
- Clear privacy policy required for production

## 🐛 Troubleshooting

### Common Issues

#### "Player not found"
- Verify player name format: `Name#TAG`
- Check if player exists in the specified region
- Ensure API key is valid

#### Rate limit exceeded
- Wait for rate limit reset
- Implement proper caching
- Consider upgrading to production key

#### API key invalid
- Check if development key has expired (24 hours)
- Verify key is correctly set in `.env`
- Ensure no extra spaces or characters

### Debug Mode
Enable debug logging:
```env
LOG_LEVEL=debug
DEV_DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Update documentation as needed
7. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Update CHANGELOG.md for significant changes
- Follow the existing code style
- Add JSDoc comments for public APIs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Riot Games](https://developer.riotgames.com/) for providing the API
- [RiotWatcher](https://github.com/pseudonym117/Riot-Watcher) for Python API wrapper inspiration
- League of Legends community for feedback and testing

## 📞 Support

- Create an issue for bug reports
- Join our Discord for community support
- Check the [FAQ](docs/FAQ.md) for common questions

## 🗺️ Roadmap

### Version 1.1
- [ ] Machine learning integration
- [ ] Historical trend analysis
- [ ] Batch player analysis
- [ ] Export functionality

### Version 1.2
- [ ] Real-time monitoring
- [ ] Tournament integration
- [ ] Advanced visualization
- [ ] Mobile app

---

**Disclaimer**: This tool provides analysis based on publicly available data and behavioral patterns. Results should be used as guidance only and not as definitive proof of account sharing or boosting. 