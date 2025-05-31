# League of Legends Smurf Detection Project

## Project Notes
This project aims to create a web application that detects potential League of Legends smurf accounts by analyzing various gameplay patterns and statistics. The project will be AI-driven with stakeholder oversight to ensure proper direction.

## Directory Structure
```
league-smurf-detector/
├── docs/                    # Documentation files
│   ├── CONTRIBUTING.md     # This file
│   ├── CHANGELOG.md        # Detailed changelog of project updates
│   ├── API.md              # API documentation
│   ├── TECHNICAL_SPECS.md  # Technical specifications and requirements
│   └── API_KEY_LIMITATIONS.md # API key usage guidelines
├── src/                    # Source code
│   ├── api/               # API endpoints and services
│   ├── models/            # Data models and schemas
│   ├── services/          # Business logic and services
│   ├── utils/             # Utility functions
│   └── tests/             # Test files (unit/integration)
├── frontend/               # Frontend application (to be implemented)
│   └── .keep               # Placeholder for future React app
├── config/                 # Configuration files (to be implemented)
│   └── .keep               # Placeholder for future config files
├── package.json            # Project manifest
├── tsconfig.json           # TypeScript configuration
├── README.md               # Project overview and setup
└── .env                    # Environment variables (not committed)
```
**Note:** Always keep this directory structure section up to date as the project evolves. The AI must check and update this section whenever new directories or files are added, removed, or reorganized.

## Current Task List

### Completed
- [x] Initial project setup
- [x] Documentation structure creation
- [x] Basic project structure setup
- [x] League of Legends API integration (RiotWatcher)

### In Progress
- [ ] Setting up development environment
- [ ] Creating data models and schemas
- [ ] Implementing smurf detection algorithms

### Next Steps
1. Create missing directory structure:
   - models/ for data models
   - frontend/ for React application
   - tests/ for test files
   - config/ for configuration files
2. Implement data models for:
   - Player analysis
   - Match history
   - Champion statistics
3. Develop smurf detection algorithms based on criteria:
   - Playtime gap analysis
   - Champion performance metrics
   - Summoner spell usage patterns
   - Player association analysis
4. Set up frontend application
5. Add test coverage
6. Implement rate limiting and caching

### Smurf Detection Criteria
1. Playtime Gaps
   - Analyze gaps between gameplay sessions
   - Longer gaps increase suspicion level

2. Champion Performance
   - First-time champion performance analysis
   - Win rate threshold: 70% or higher
   - KDA threshold: 3.0 or higher
   - CS per minute threshold: 8.0 or higher
   - Note: These are not binary thresholds but contribute to a probability score

3. Summoner Spell Usage
   - Track summoner spell key bindings
   - Analyze patterns of spell placement changes
   - Sudden changes in spell placement patterns

4. Player Association
   - Analyze games played with higher ELO players
   - Track associations with high win-rate players
   - Consider player network analysis

## AI Development Guidelines
1. Act as the main solo developer for this project, taking initiative in all development decisions
2. Always check the directory structure before making changes
3. Keep the project organized according to the defined structure
4. Update CONTRIBUTING.md and CHANGELOG.md with every significant change
5. Document all API endpoints and data models
6. Follow best practices for code organization and documentation
7. Maintain clear communication about progress and challenges
8. Proactively identify and address potential issues
9. Keep the stakeholder informed of major decisions and changes
10. Take ownership of the project's technical direction and implementation
11. Propose solutions and improvements without waiting for explicit instructions
12. Consider scalability, maintainability, and best practices in all decisions
13. Always do as much as possible autonomously; only reference the user when absolutely necessary, and always prepare all pre-work before requesting user input to maximize efficiency.

## Project Alignment Checklist
Before proceeding with any new feature or change, ensure:
1. Directory Structure
   - [ ] All required directories exist
   - [ ] Files are in correct locations
   - [ ] No orphaned or misplaced files

2. Documentation
   - [ ] CONTRIBUTING.md is up to date
   - [ ] CHANGELOG.md reflects recent changes
   - [ ] API.md documents all endpoints
   - [ ] README.md has latest setup instructions

3. Code Organization
   - [ ] TypeScript types are properly defined
   - [ ] Error handling is implemented
   - [ ] Logging is in place
   - [ ] Code follows project structure

4. Testing
   - [ ] Unit tests exist for new code
   - [ ] Integration tests are updated
   - [ ] Test coverage is maintained

5. Dependencies
   - [ ] All required packages are installed
   - [ ] Type definitions are available
   - [ ] No conflicting dependencies

6. Environment
   - [ ] Environment variables are documented
   - [ ] Configuration files are in place
   - [ ] Development setup is complete

7. Security
   - [ ] API keys are properly handled
   - [ ] Rate limiting is implemented
   - [ ] Input validation is in place

8. Performance
   - [ ] Caching is implemented where needed
   - [ ] Database queries are optimized
   - [ ] API calls are efficient

This checklist must be reviewed and completed before marking any task as complete.

## Reference Data
Initial player data to analyze:
- 8lackk#NA1
- Wardomm#NA1
- Domlax#Rat
- Øàth#HIM
- El Meat#NA1

## Riot API Guidelines and Restrictions

### Rate Limits
- Development API Key: 20 requests per second
- Production API Key: 100 requests per second
- Must implement proper rate limiting in the application
- Must cache responses when possible to minimize API calls

### Data Usage Restrictions
1. Match Data
   - Can only store match data for 24 hours
   - Must delete match data after 24 hours
   - Can only store aggregate statistics long-term

2. Summoner Data
   - Can store basic summoner information
   - Must refresh data periodically
   - Cannot store sensitive personal information

3. Caching Requirements
   - Must implement caching for all API responses
   - Cache duration should be reasonable (e.g., 5 minutes for summoner data)
   - Must respect cache-control headers from Riot API

### Prohibited Actions
1. Cannot use API for:
   - Automated matchmaking
   - Real-time game manipulation
   - Automated account creation
   - Botting or automation of gameplay

2. Cannot store:
   - Full match history indefinitely
   - Personal information beyond basic summoner data
   - Sensitive account information

3. Must not:
   - Share API keys
   - Use API for commercial purposes without approval
   - Violate Riot's Terms of Service

## Project Scope and Goals

### Primary Objectives
1. Smurf Detection
   - Analyze gameplay patterns
   - Track champion mastery progression
   - Monitor win rates and performance metrics
   - Identify suspicious account behavior

2. Data Analysis
   - Aggregate statistics for player behavior
   - Track performance patterns
   - Monitor champion mastery progression
   - Analyze match history patterns

3. User Interface
   - Clean, intuitive design
   - Real-time data updates
   - Clear visualization of analysis results
   - Easy-to-understand smurf probability indicators

### Technical Requirements
1. API Integration
   - Proper rate limiting implementation
   - Efficient caching system
   - Error handling and retry logic
   - Data validation and sanitization

2. Data Management
   - Temporary storage of match data
   - Aggregate statistics storage
   - Regular data cleanup
   - Secure data handling

3. Performance
   - Fast response times
   - Efficient data processing
   - Optimized API calls
   - Proper error handling

### Questions for Stakeholder
1. Target Audience
   - Who are the primary users of this tool?
   - What level of technical expertise do they have?
   - What specific features are most important to them?

2. Data Requirements
   - What specific metrics are most important for smurf detection?
   - How long should we retain aggregate statistics?
   - What level of detail is needed in the analysis?

3. User Experience
   - What kind of interface would be most useful?
   - How should we present the smurf probability?
   - What additional features would be valuable?

4. Deployment
   - Where will the application be hosted?
   - What are the expected user numbers?
   - What are the performance requirements?

### Target Audience
1. Primary Users
   - Daily League of Legends players
   - Competitive tournament organizers
   - Community tournament administrators
   - Tournament participants

2. Use Cases
   - Tournament eligibility verification
   - Rank-restricted tournament enforcement
   - Player skill level validation
   - Fair play monitoring

### Data Analysis Requirements
1. Smurf Detection Metrics
   - Champion mastery progression
   - Win rates on low-playtime champions
   - Performance patterns across different roles
   - Account age vs. performance metrics
   - Unusual skill progression patterns
   - Cross-reference multiple data points

2. Analysis Presentation
   - Color-coded smurf probability indicator
   - Detailed reasoning for probability assessment
   - Specific traits and patterns identified
   - Clear explanation of detection criteria
   - Summary of key findings

### Technical Implementation
1. Web Interface
   - Responsive design
   - Real-time data updates
   - Clear visualization of results
   - User-friendly analysis presentation
   - Mobile-friendly layout

2. Initial Deployment
   - Small-scale deployment (5-10 users)
   - Scalable architecture for future growth
   - Cloud-based hosting
   - Regular backups
   - Monitoring and logging

### Development Priorities
1. Core Features
   - Accurate smurf detection algorithms
   - Comprehensive data analysis
   - Clear result presentation
   - Reliable API integration
   - Proper rate limiting and caching

2. User Experience
   - Intuitive interface
   - Clear probability indicators
   - Detailed analysis explanations
   - Easy-to-understand metrics
   - Responsive design

### Deployment Strategy
1. Initial Phase
   - GitHub Pages for landing page and documentation
   - Development environment for testing
   - Local development server for initial testing

2. Production Phase
   - Cloud hosting platform (TBD)
   - Custom domain registration
   - SSL certificate implementation
   - Regular backups
   - Monitoring and logging

3. URL Structure
   - Landing Page: TBD (GitHub Pages or custom domain)
   - API Endpoints: TBD
   - Documentation: TBD
   - Development: TBD

4. Hosting Requirements
   - Node.js environment
   - SSL/TLS support
   - Database hosting
   - CDN for static assets
   - Regular backups
   - Monitoring tools 