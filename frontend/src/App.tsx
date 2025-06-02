import React, { useState } from 'react';
import { DetailedAnalysis } from './components/DetailedAnalysis';
import { EnhancedPlayerDashboard } from './components/EnhancedPlayerDashboard';
import ChallengerDemo from './components/ChallengerDemo';
import DebugTest from './components/DebugTest';
import styled from 'styled-components';
import './App.css';

interface SmurfAnalysis {
  playerName: string;
  smurfProbability: number;
  championPerformance: {
    firstTimeChampions: Array<{
      championName: string;
      winRate: number;
      kda: number;
      csPerMinute: number;
      suspicionLevel: number;
    }>;
    overallPerformanceScore: number;
  };
  summonerSpellUsage: {
    spellPlacementChanges: Array<{
      gameId: string;
      timestamp: Date;
      oldSpells: [number, number];
      newSpells: [number, number];
    }>;
    patternChangeScore: number;
  };
  playtimeGaps: {
    gaps: Array<{
      startDate: Date;
      endDate: Date;
      durationHours: number;
      suspicionLevel: number;
    }>;
    totalGapScore: number;
  };
}

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
`;

const SearchSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 600px;
`;

const PlayerInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 2px solid #333;
  border-radius: 6px;
  font-size: 16px;
  background: #2a2a2a;
  color: #fff;

  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const AnalyzeButton = styled.button`
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #45a049;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const ProbabilityDisplay = styled.div<{ probability: number }>`
  text-align: center;
  margin: 30px 0;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;
  border: 4px solid ${props => {
    if (props.probability >= 0.8) return '#ff4757';
    if (props.probability >= 0.6) return '#ff6b35';
    if (props.probability >= 0.4) return '#ffa502';
    if (props.probability >= 0.2) return '#26de81';
    return '#2ed573';
  }};
`;

const ProbabilityValue = styled.div`
  font-size: 48px;
  font-weight: bold;
  margin: 10px 0;
`;

const ProbabilityLabel = styled.div`
  font-size: 24px;
  color: #888;
`;

// Add a tab component
const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  border: 1px solid ${props => props.$active ? '#3b82f6' : '#475569'};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: ${props => props.$active ? '600' : '400'};

  &:hover {
    background: ${props => props.$active ? '#2563eb' : '#374151'};
    color: ${props => props.$active ? 'white' : '#f1f5f9'};
  }
`;

const ViewModeToggle = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
`;

const ViewButton = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  background: ${props => props.$active ? '#4CAF50' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#4CAF50'};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.$active ? '#45a049' : 'rgba(76, 175, 80, 0.1)'};
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'demo' | 'debug'>('demo');
  const [viewMode, setViewMode] = useState<'enhanced' | 'classic'>('enhanced');
  const [playerName, setPlayerName] = useState('');
  const [analysis, setAnalysis] = useState<SmurfAnalysis | null>(null);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (viewMode === 'enhanced') {
        // Try enhanced analysis with multiple endpoints
        const enhancedEndpoints = [
          `https://smurfgaurd-production.up.railway.app/api/analyze/comprehensive/${encodeURIComponent(playerName)}`,
          `http://localhost:3000/api/analyze/comprehensive/${encodeURIComponent(playerName)}`,
          `https://smurfgaurd-production.up.railway.app/api/analyze/basic/${encodeURIComponent(playerName)}`,
          `http://localhost:3000/api/analyze/basic/${encodeURIComponent(playerName)}`
        ];
        
        let enhancedSuccess = false;
        for (const endpoint of enhancedEndpoints) {
          try {
            console.log(`Trying enhanced endpoint: ${endpoint}`);
            const response = await fetch(endpoint);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Check if response is HTML instead of JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              throw new Error(`Endpoint returned HTML instead of JSON. Content-Type: ${contentType}`);
            }
            
            const responseText = await response.text();
            
            // Enhanced HTML detection
            if (responseText.trim().startsWith('<!DOCTYPE') || 
                responseText.trim().startsWith('<html') || 
                responseText.trim().startsWith('<!doctype') ||
                responseText.includes('<html>') ||
                responseText.includes('<!DOCTYPE html>')) {
              throw new Error(`Endpoint returned HTML page instead of JSON. Response starts with: ${responseText.substring(0, 100)}...`);
            }
            
            // Additional safety check for empty or invalid responses
            if (!responseText || responseText.trim().length === 0) {
              throw new Error(`Endpoint returned empty response`);
            }
            
            // Try to parse as JSON with enhanced error handling
            let data;
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              // Enhanced JSON parsing error with more context
              const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error';
              const preview = responseText.substring(0, 200);
              console.error(`JSON parsing failed for endpoint ${endpoint}:`, {
                error: errorMessage,
                responsePreview: preview,
                responseLength: responseText.length,
                contentType: contentType
              });
              throw new Error(`JSON parsing failed (${errorMessage}). Response preview: ${preview}...`);
            }
            
            if (data.success) {
              setEnhancedAnalysis(data.data);
              setAnalysis(null);
              enhancedSuccess = true;
              console.log(`Enhanced analysis successful with: ${endpoint}`);
              break;
            } else {
              throw new Error(data.message || 'Enhanced analysis failed');
            }
          } catch (err) {
            console.log(`Failed enhanced endpoint ${endpoint}:`, err);
            continue;
          }
        }
        
        if (!enhancedSuccess) {
          // Show informative message about API limitations
          setError('Enhanced analysis requires Personal API Key access. Currently using mock data for demonstration. See our Demo tab for working examples!');
          
          // Create mock enhanced analysis for demo purposes
          setEnhancedAnalysis({
            summoner: {
              name: playerName,
              level: 30,
              profileIconId: 1,
              region: 'na1'
            },
            smurfDetection: {
              overallProbability: Math.floor(Math.random() * 60) + 20, // Random 20-80%
              evidenceLevel: 'moderate',
              categoryBreakdown: {
                performanceMetrics: { score: Math.floor(Math.random() * 40) + 40, weight: 0.35 },
                historicalAnalysis: { score: Math.floor(Math.random() * 40) + 30, weight: 0.25 },
                championMastery: { score: Math.floor(Math.random() * 50) + 30, weight: 0.20 },
                gapAnalysis: { score: Math.floor(Math.random() * 60) + 20, weight: 0.15 },
                behavioralPatterns: { score: Math.floor(Math.random() * 40) + 20, weight: 0.05 }
              }
            },
            analysisMetadata: {
              dataQuality: {
                gamesAnalyzed: Math.floor(Math.random() * 50) + 10,
                timeSpanDays: Math.floor(Math.random() * 180) + 30,
                reliabilityScore: Math.floor(Math.random() * 30) + 60
              }
            },
            avgKDA: (Math.random() * 3 + 1).toFixed(1),
            avgCS: (Math.random() * 3 + 5).toFixed(1),
            visionScore: (Math.random() * 2).toFixed(1),
            damageShare: Math.floor(Math.random() * 15 + 15).toString()
          });
          setAnalysis(null);
        }
      } else {
        // Classic analysis mode with multiple endpoints  
        const basicEndpoints = [
          `https://smurfgaurd-production.up.railway.app/api/analyze/basic/${encodeURIComponent(playerName)}`,
          `http://localhost:3000/api/analyze/basic/${encodeURIComponent(playerName)}`
        ];
        
        let basicSuccess = false;
        for (const endpoint of basicEndpoints) {
          try {
            console.log(`Trying basic endpoint: ${endpoint}`);
            const response = await fetch(endpoint);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Check if response is HTML instead of JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              throw new Error(`Endpoint returned HTML instead of JSON. Content-Type: ${contentType}`);
            }
            
            const responseText = await response.text();
            
            // Enhanced HTML detection
            if (responseText.trim().startsWith('<!DOCTYPE') || 
                responseText.trim().startsWith('<html') || 
                responseText.trim().startsWith('<!doctype') ||
                responseText.includes('<html>') ||
                responseText.includes('<!DOCTYPE html>')) {
              throw new Error(`Endpoint returned HTML page instead of JSON. Response starts with: ${responseText.substring(0, 100)}...`);
            }
            
            // Additional safety check for empty or invalid responses
            if (!responseText || responseText.trim().length === 0) {
              throw new Error(`Endpoint returned empty response`);
            }
            
            // Try to parse as JSON with enhanced error handling
            let data;
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              // Enhanced JSON parsing error with more context
              const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error';
              const preview = responseText.substring(0, 200);
              console.error(`JSON parsing failed for endpoint ${endpoint}:`, {
                error: errorMessage,
                responsePreview: preview,
                responseLength: responseText.length,
                contentType: contentType
              });
              throw new Error(`JSON parsing failed (${errorMessage}). Response preview: ${preview}...`);
            }
            
            if (data.success) {
              setAnalysis(data.data);
              setEnhancedAnalysis(null);
              basicSuccess = true;
              console.log(`Basic analysis successful with: ${endpoint}`);
              break;
            } else {
              throw new Error(data.message || 'Analysis failed');
            }
          } catch (err) {
            console.log(`Failed basic endpoint ${endpoint}:`, err);
            continue;
          }
        }
        
        if (!basicSuccess) {
          // Show informative message about API limitations
          setError('Player analysis requires Personal API Key access. Currently using Development API Key with limited permissions. See our Demo tab for working challenger analysis examples!');
          
          // Create mock basic analysis for demo purposes
          const mockProbability = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
          setAnalysis({
            playerName,
            smurfProbability: mockProbability,
            championPerformance: {
              firstTimeChampions: [],
              overallPerformanceScore: Math.floor(mockProbability * 100)
            },
            summonerSpellUsage: {
              spellPlacementChanges: [],
              patternChangeScore: Math.floor(mockProbability * 100)
            },
            playtimeGaps: {
              gaps: [],
              totalGapScore: Math.floor(mockProbability * 100)
            }
          });
          setEnhancedAnalysis(null);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during analysis');
      setAnalysis(null);
      setEnhancedAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityLabel = (probability: number) => {
    if (probability >= 0.8) return 'Very High Smurf Probability';
    if (probability >= 0.6) return 'High Smurf Probability';
    if (probability >= 0.4) return 'Moderate Smurf Probability';
    if (probability >= 0.2) return 'Low Smurf Probability';
    return 'Very Low Smurf Probability';
  };

  return (
    <div className="App">
      <AppContainer>
        <Header>
          <h1>🕵️ LoL SmurfGuard</h1>
          <p>Advanced League of Legends Smurf Detection System</p>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Professional-grade analysis with 5+ year historical data support
          </p>
        </Header>

        {/* View Mode Toggle */}
        <ViewModeToggle>
          <ViewButton 
            $active={viewMode === 'enhanced'} 
            onClick={() => setViewMode('enhanced')}
          >
            🚀 Enhanced Dashboard
          </ViewButton>
          <ViewButton 
            $active={viewMode === 'classic'} 
            onClick={() => setViewMode('classic')}
          >
            📊 Classic Analysis
          </ViewButton>
        </ViewModeToggle>

        {/* Tab Navigation */}
        <TabContainer>
          <Tab $active={activeTab === 'demo'} onClick={() => setActiveTab('demo')}>
            🏆 Demo
          </Tab>
          <Tab $active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
            🔍 Analysis
          </Tab>
          <Tab $active={activeTab === 'debug'} onClick={() => setActiveTab('debug')}>
            🐞 Debug
          </Tab>
        </TabContainer>

        {activeTab === 'demo' && <ChallengerDemo />}

        {activeTab === 'analysis' && (
          <>
            <SearchSection>
              <SearchContainer>
                <PlayerInput
                  type="text"
                  placeholder="Enter summoner name (e.g., Doublelift)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                />
                <AnalyzeButton onClick={handleAnalyze} disabled={loading}>
                  {loading ? '🔍 Analyzing...' : '🚀 Analyze'}
                </AnalyzeButton>
              </SearchContainer>
            </SearchSection>

            {error && (
              <div style={{
                background: '#ff4757',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {loading && (
              <div style={{
                background: '#2a2a2a',
                padding: '40px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#fff',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                  {viewMode === 'enhanced' ? 'Running comprehensive analysis...' : 'Analyzing player data...'}
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  {viewMode === 'enhanced' 
                    ? 'Processing historical data, champion mastery, and behavioral patterns...'
                    : 'This may take a few moments...'}
                </div>
              </div>
            )}

            {/* Enhanced Dashboard */}
            {viewMode === 'enhanced' && enhancedAnalysis && !loading && (
              <EnhancedPlayerDashboard 
                playerData={enhancedAnalysis}
                isLoading={loading}
              />
            )}

            {/* Classic Analysis Display */}
            {viewMode === 'classic' && analysis && !loading && (
              <>
                <ProbabilityDisplay probability={analysis.smurfProbability}>
                  <ProbabilityValue>{Math.round(analysis.smurfProbability * 100)}%</ProbabilityValue>
                  <ProbabilityLabel>{getProbabilityLabel(analysis.smurfProbability)}</ProbabilityLabel>
                </ProbabilityDisplay>

                <DetailedAnalysis analysis={analysis} />
              </>
            )}

            {/* Help Text */}
            {!analysis && !enhancedAnalysis && !loading && (
              <div style={{
                background: '#2a2a2a',
                padding: '30px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#888',
                marginTop: '20px'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '15px' }}>🎮</div>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                  Enter a summoner name to begin analysis
                </div>
                <div style={{ fontSize: '14px' }}>
                  {viewMode === 'enhanced' 
                    ? 'Enhanced mode provides comprehensive historical analysis with advanced smurf detection algorithms'
                    : 'Classic mode provides basic smurf detection analysis'}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'debug' && <DebugTest />}
      </AppContainer>
    </div>
  );
}

export default App;
