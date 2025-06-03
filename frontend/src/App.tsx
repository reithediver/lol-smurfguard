import React, { useState } from 'react';
import './App.css';
import styled from 'styled-components';
import { apiService } from './services/api';
import { SmurfAnalysis, Region, AnalysisRequest } from './types';
import ChallengerDemo from './components/ChallengerDemo';
import { AdvancedSmurfAnalysis } from './components/AdvancedSmurfAnalysis';
import DebugTest from './components/DebugTest';
import { EnhancedPlayerDashboard } from './components/EnhancedPlayerDashboard';

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
  const [activeTab, setActiveTab] = useState<'analysis' | 'advanced' | 'demo' | 'debug'>('demo');
  const [viewMode, setViewMode] = useState<'enhanced' | 'classic'>('enhanced');
  const [playerName, setPlayerName] = useState('');
  const [analysis, setAnalysis] = useState<SmurfAnalysis | null>(null);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (viewMode === 'enhanced') {
        // Use the new OP.GG enhanced analysis
        console.log(`🌟 Starting OP.GG enhanced analysis for: ${playerName}`);
        
        try {
          const enhancedResult = await apiService.analyzePlayerEnhanced(playerName, 'na1');
          setEnhancedAnalysis(enhancedResult);
          setAnalysis(null);
          console.log('✅ OP.GG enhanced analysis successful');
        } catch (enhancedError) {
          console.warn('⚠️ Enhanced analysis failed, creating demo data:', enhancedError);
          
          // Create enhanced demo data for demonstration
          setEnhancedAnalysis({
            summoner: {
              name: playerName,
              level: 30 + Math.floor(Math.random() * 200),
              profileIconId: Math.floor(Math.random() * 50) + 1,
              region: 'na1'
            },
            smurfDetection: {
              overallProbability: Math.floor(Math.random() * 60) + 20, // Random 20-80%
              evidenceLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
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
              },
              dataSource: 'Demo Mode - Real OP.GG integration available',
              apiLimitations: ['Using demo data due to API limitations']
            },
            avgKDA: (Math.random() * 3 + 1).toFixed(1),
            avgCS: (Math.random() * 3 + 5).toFixed(1),
            visionScore: (Math.random() * 2).toFixed(1),
            damageShare: Math.floor(Math.random() * 15 + 15).toString()
          });
          setAnalysis(null);
          
          setError('Enhanced analysis requires OP.GG integration. Showing demo data. Real integration available when backend is properly configured!');
        }
      } else {
        // Classic analysis mode
        console.log(`📊 Starting basic analysis for: ${playerName}`);
        
        try {
          const basicResult = await apiService.analyzePlayer({
            playerName,
            region: 'na1',
            gameCount: 20,
            includeRanked: true,
            includeNormal: false
          });
          setAnalysis(basicResult);
          setEnhancedAnalysis(null);
          console.log('✅ Basic analysis successful');
        } catch (basicError) {
          console.warn('⚠️ Basic analysis failed, creating demo data:', basicError);
          
          // Create basic demo data matching SmurfAnalysis interface
          const mockProbability = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
          const mockAnalysis: SmurfAnalysis = {
            playerName,
            puuid: 'mock-puuid-' + Date.now(),
            smurfProbability: mockProbability,
            confidenceLevel: 75 + Math.random() * 25,
            reasons: [
              {
                type: 'CHAMPION_PERFORMANCE',
                severity: 'HIGH',
                description: 'Exceptional performance on recently played champions',
                confidence: 85,
                evidence: ['90% win rate on Yasuo with only 8 games', 'KDA of 4.2 significantly above average']
              }
            ],
            championStats: [
              {
                championId: 157,
                championName: 'Yasuo',
                winRate: 85 + Math.random() * 15,
                kda: 2.5 + Math.random() * 2,
                csPerMinute: 7 + Math.random() * 2,
                gamesPlayed: 8,
                averageDamage: 28500,
                visionScore: 15,
                masteryLevel: 4,
                masteryPoints: 12500,
                recentPerformance: []
              }
            ],
            playtimeGaps: [7, 14, 21],
            accountAge: 45,
            totalGamesAnalyzed: 50,
            analysisDate: new Date().toISOString(),
            detectionCriteria: {
              championPerformanceThreshold: {
                winRateThreshold: 70,
                kdaThreshold: 3.0,
                csPerMinuteThreshold: 8.0,
                minimumGames: 5
              },
              playtimeGapThreshold: {
                suspiciousGapDays: 7,
                maximumGapCount: 3
              },
              summonerSpellAnalysis: {
                trackKeyBindings: true,
                patternChangeThreshold: 3
              },
              playerAssociation: {
                highEloThreshold: 'DIAMOND',
                associationCount: 5
              }
            }
          };
          
          setAnalysis(mockAnalysis);
          setEnhancedAnalysis(null);
          
          setError('Basic analysis requires Personal API Key access. Showing demo data. See Demo tab for working examples!');
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

  // Check integration status on component mount
  React.useEffect(() => {
    const checkIntegrationStatus = async () => {
      try {
        const status = await apiService.getOpggIntegrationStatus();
        setIntegrationStatus(status);
        console.log('OP.GG Integration Status:', status);
      } catch (error) {
        console.warn('Could not get integration status:', error);
        setIntegrationStatus({ opggEnabled: false, limitations: ['Integration status unavailable'] });
      }
    };

    checkIntegrationStatus();
  }, []);

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
            Professional-grade analysis with OP.GG integration {integrationStatus?.opggEnabled ? '✅' : '⚠️'}
          </p>
        </Header>

        {/* View Mode Toggle */}
        <ViewModeToggle>
          <ViewButton 
            $active={viewMode === 'enhanced'} 
            onClick={() => setViewMode('enhanced')}
          >
            🚀 Enhanced Dashboard {integrationStatus?.opggEnabled ? '(OP.GG)' : '(Demo)'}
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
          <Tab $active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')}>
            🔍 Advanced Detection
          </Tab>
          <Tab $active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
            🔍 Analysis
          </Tab>
          <Tab $active={activeTab === 'debug'} onClick={() => setActiveTab('debug')}>
            🐞 Debug
          </Tab>
        </TabContainer>

        {activeTab === 'demo' && <ChallengerDemo />}

        {activeTab === 'advanced' && <AdvancedSmurfAnalysis />}

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

            {/* Integration Status Display */}
            {integrationStatus && (
              <div style={{
                background: integrationStatus.opggEnabled ? '#2d5a27' : '#5a4027',
                color: 'white',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '20px',
                textAlign: 'center',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  {integrationStatus.opggEnabled ? 
                    '✅ OP.GG Integration Active - Real data analysis available' : 
                    '⚠️ OP.GG Integration Disabled - Using demo/fallback data'
                  }
                </span>
                <button
                  onClick={async () => {
                    try {
                      const status = await apiService.getOpggIntegrationStatus();
                      setIntegrationStatus(status);
                    } catch (error) {
                      console.warn('Failed to refresh status:', error);
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
            )}

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
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
                <div>Analyzing player data...</div>
                <div style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
                  {viewMode === 'enhanced' ? 'Using OP.GG enhanced analysis' : 'Using basic analysis'}
                </div>
              </div>
            )}

            {/* Enhanced Analysis Results */}
            {enhancedAnalysis && viewMode === 'enhanced' && (
              <EnhancedPlayerDashboard 
                playerData={enhancedAnalysis}
                isLoading={loading}
              />
            )}

            {/* Classic Analysis Results */}
            {analysis && viewMode === 'classic' && (
              <>
                <ProbabilityDisplay probability={analysis.smurfProbability}>
                  <ProbabilityLabel>Smurf Detection Result</ProbabilityLabel>
                  <ProbabilityValue>{(analysis.smurfProbability * 100).toFixed(1)}%</ProbabilityValue>
                  <ProbabilityLabel>{getProbabilityLabel(analysis.smurfProbability)}</ProbabilityLabel>
                </ProbabilityDisplay>

                {/* Show detailed analysis only if the data structure matches expectations */}
                {analysis.championStats && Array.isArray(analysis.championStats) && analysis.championStats.length > 0 && (
                  <div style={{
                    background: '#2a2a2a',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ color: '#e2e8f0', marginBottom: '16px' }}>🏆 Champion Performance</h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '12px' 
                    }}>
                      {analysis.championStats.slice(0, 4).map((champ, index) => (
                        <div key={index} style={{
                          background: 'rgba(45, 55, 72, 0.6)',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(74, 85, 104, 0.3)'
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>
                            {champ.championName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                            <div>Win Rate: {Math.round(champ.winRate)}%</div>
                            <div>KDA: {champ.kda.toFixed(1)}</div>
                            <div>CS/min: {champ.csPerMinute.toFixed(1)}</div>
                            <div>Games: {champ.gamesPlayed}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show detection reasons */}
                {analysis.reasons && Array.isArray(analysis.reasons) && analysis.reasons.length > 0 && (
                  <div style={{
                    background: '#2a2a2a',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ color: '#e2e8f0', marginBottom: '16px' }}>🚨 Detection Indicators</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analysis.reasons.map((reason, index) => (
                        <div key={index} style={{
                          background: reason.severity === 'HIGH' ? 'rgba(252, 129, 129, 0.1)' : 'rgba(236, 201, 75, 0.1)',
                          padding: '12px',
                          borderRadius: '6px',
                          border: `1px solid ${reason.severity === 'HIGH' ? 'rgba(252, 129, 129, 0.3)' : 'rgba(236, 201, 75, 0.3)'}`
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '4px' }}>
                            {reason.type.replace('_', ' ')} ({reason.severity})
                          </div>
                          <div style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>
                            {reason.description}
                          </div>
                          {reason.evidence && reason.evidence.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#68d391' }}>
                              Evidence: {reason.evidence.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'debug' && <DebugTest />}
      </AppContainer>
    </div>
  );
}

export default App;
