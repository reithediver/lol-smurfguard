import React, { useState } from 'react';
import UnifiedSmurfAnalysis from './components/UnifiedSmurfAnalysis';
import { apiService } from './services/api';
import styled from 'styled-components';
import ProgressBar from './components/ProgressBar';
import './App.css';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #0f172a;
  min-height: 100vh;
  color: #f1f5f9;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #94a3b8;
  margin-bottom: 30px;
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

  &::placeholder {
    color: #64748b;
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

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  color: #ef4444;
  text-align: center;
  white-space: pre-line;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 1.1rem;
`;

const DebugSection = styled.div`
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #94a3b8;
`;

const DebugTitle = styled.h3`
  color: #60a5fa;
  margin: 0 0 10px 0;
  font-size: 1rem;
`;

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🔥 React Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 React Error Boundary - Full error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1a1a1a',
          color: '#fff',
          minHeight: '100vh',
          fontFamily: 'monospace'
        }}>
          <h1>🔥 Application Error</h1>
          <p>Something went wrong. The page crashed but we caught it!</p>
          <details style={{ marginTop: '20px', color: '#ff6b6b' }}>
            <summary>Error Details</summary>
            <pre>{this.state.error?.stack || this.state.error?.message}</pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [playerName, setPlayerName] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  // Removed comprehensiveData - only using unified analysis
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  // Removed viewMode - always use unified analysis
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing analysis...');

  const handleAnalyze = async () => {
    try {
      console.log('🚀 handleAnalyze started');
      
      if (!playerName.trim()) {
        console.log('❌ Empty player name');
        setError('Please enter a Riot ID');
        return;
      }

      // Check if it's a Riot ID format
      if (!playerName.includes('#')) {
        console.log('❌ Invalid Riot ID format');
        setError(`Please enter a valid Riot ID in the format: GameName#TAG

Examples:
• Reinegade#Rei  
• YourName#NA1
• Player#123

You can find your Riot ID in your League client profile.`);
        return;
      }

      console.log('✅ Validation passed, starting analysis');
      setLoading(true);
      setError('');
      setAnalysisData(null);
      
      console.log(`🔍 Searching for player: ${playerName}`);
      setLoadingStatus('Fetching summoner information...');
      
      let result;
      
      // Always use unified analysis with 5 years of data (1000+ matches)
      console.log('🎯 Using unified analysis endpoint with extensive match history...');
      
      try {
        // Set loading status updates with a timer to simulate progress
        const loadingMessages = [
          'Fetching summoner information...',
          'Retrieving match history...',
          'Processing recent matches...',
          'Analyzing performance metrics...',
          'Detecting outlier games...',
          'Calculating benchmarks...',
          'Finalizing analysis...'
        ];
        
        let messageIndex = 0;
        const statusInterval = setInterval(() => {
          if (messageIndex < loadingMessages.length - 1) {
            setLoadingStatus(loadingMessages[++messageIndex]);
          }
        }, 4000);
        
        result = await apiService.getUnifiedAnalysis(playerName, { 
          region: 'na1', 
          matches: 500 // 500+ games for comprehensive analysis
        });
        
        clearInterval(statusInterval);
        console.log('🎯 Unified analysis completed, result:', result);
        
        if (result && result.success && result.data) {
          console.log(`✅ Unified analysis data received for: ${playerName}`);
          setUnifiedData(result.data);
          return; // Exit early
        } else {
          throw new Error(result?.error?.message || 'Unified analysis failed');
        }
      } catch (analysisError) {
        console.error('❌ Analysis request failed:', analysisError);
        throw analysisError;
      }
      
    } catch (error: any) {
      console.error('❌ Analysis failed with error:', error);
      console.error('❌ Error stack:', error.stack);
      
      try {
        // Handle specific error types based on error object properties
        if (error.type === 'TIMEOUT_ERROR') {
          setError(`Analysis timed out for "${playerName}".

The server is taking too long to respond. This could be due to:
• High server load
• Complex analysis with many matches
• Network connectivity issues

You can try:
• Refreshing the page and trying again
• Trying at a different time
• Checking your internet connection`);
        } else if (error.type === 'PLAYER_NOT_FOUND') {
          setError(`Player "${playerName}" not found.

${error.suggestions ? error.suggestions.join('\n• ') : 'Please check the spelling and format.'}`);
        } else if (error.type === 'API_ACCESS_FORBIDDEN') { 
          setError(`Cannot access data for "${playerName}".

${error.suggestions ? error.suggestions.join('\n• ') : 'This may be due to API restrictions.'}`);
        } else if (error.type === 'ANALYSIS_FAILED') {
          setError(`Unable to analyze "${playerName}".

${error.suggestions ? error.suggestions.join('\n• ') : 'Please try a different player.'}`);
        } else {
          // Fallback to checking message content for backward compatibility
          if (error.message && error.message.includes('404')) {
            setError(`Player "${playerName}" not found.

Please check:
• Spelling and capitalization  
• Include the # and tag (e.g., GameName#TAG)
• Verify the player exists in NA region`);
          } else if (error.message && error.message.includes('403')) {
            setError(`Cannot access data for "${playerName}".

This may be due to:
• API access restrictions
• Player privacy settings  
• Try a different player`);
          } else {
            setError(`Failed to analyze "${playerName}".

${error.message || 'Please try again or verify the Riot ID format.'}

Technical details: ${error.stack || 'No stack trace available'}`);
          }
        }
      } catch (setErrorError) {
        // Last resort error handling
      }
    } finally {
      try {
        console.log('🏁 Setting loading to false');
        setLoading(false);
        console.log('✅ handleAnalyze completed');
      } catch (finallyError) {
        console.error('❌ Error in finally block:', finallyError);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAnalyze();
    }
  };

  const testBackendConnection = async () => {
    try {
      const health = await apiService.healthCheck();
      
      // Use the same safe logic as ApiService
      let isLocalDevelopment = false;
      let hostname = 'unknown';
      
      try {
        if (typeof window !== 'undefined' && window.location) {
          hostname = window.location.hostname;
          isLocalDevelopment = process.env.NODE_ENV === 'development' && hostname === 'localhost';
        }
      } catch (error) {
        console.warn('Could not access window.location in debug:', error);
      }
      
      const apiUrl = isLocalDevelopment 
        ? 'http://localhost:3001/api'
        : 'https://smurfgaurd-production.up.railway.app/api';
      
      setDebugInfo({
        apiUrl,
        isLocalDevelopment,
        hostname,
        NODE_ENV: process.env.NODE_ENV,
        healthCheck: health,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      // Use the same safe logic as ApiService
      let isLocalDevelopment = false;
      let hostname = 'unknown';
      
      try {
        if (typeof window !== 'undefined' && window.location) {
          hostname = window.location.hostname;
          isLocalDevelopment = process.env.NODE_ENV === 'development' && hostname === 'localhost';
        }
      } catch (error) {
        console.warn('Could not access window.location in debug error:', error);
      }
      
      const apiUrl = isLocalDevelopment 
        ? 'http://localhost:3001/api'
        : 'https://smurfgaurd-production.up.railway.app/api';
      
      setDebugInfo({
        apiUrl,
        isLocalDevelopment,
        hostname,
        NODE_ENV: process.env.NODE_ENV,
        error: error.message,
        type: error.type,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <ErrorBoundary>
      <AppContainer>
        <Header>
          <Title>SmurfGuard</Title>
          <Subtitle>Advanced League of Legends Smurf Detection</Subtitle>
          
          <SearchSection>

            <SearchContainer>
              <PlayerInput
                type="text"
                placeholder="Enter Riot ID (GameName#TAG) - e.g., Reinegade#Rei"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <AnalyzeButton onClick={handleAnalyze} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze'}
              </AnalyzeButton>
            </SearchContainer>
          </SearchSection>
        </Header>

        <DebugSection>
          <DebugTitle>🔧 Debug Information</DebugTitle>
          <button 
            onClick={testBackendConnection}
            style={{
              background: '#334155',
              color: '#f1f5f9',
              border: '1px solid #475569',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Test Backend Connection
          </button>
          {debugInfo && (
            <pre style={{ 
              background: '#1e293b', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </DebugSection>

        {error && (
          <ErrorMessage>
            {error}
            
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => handleAnalyze()} 
                style={{ 
                  padding: '8px 16px', 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  cursor: 'pointer'
                }}
              >
                Retry Analysis
              </button>
            </div>
          </ErrorMessage>
        )}
        
        {loading && (
          <LoadingMessage>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>⏳</span>
              Analyzing {playerName}...
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
              This comprehensive analysis may take 20-30 seconds as we process 500+ matches and compare against rank benchmarks.
            </div>
            
            <ProgressBar 
              determinate={false} 
              duration={30} 
              status={loadingStatus}
            />
            
            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
              {loadingStatus}
            </div>
          </LoadingMessage>
        )}

        {analysisData && (
          <div style={{ 
            background: '#1e293b', 
            borderRadius: '12px', 
            padding: '24px', 
            margin: '20px 0',
            color: '#f1f5f9'
          }}>
            <h2 style={{ 
              color: '#60a5fa', 
              marginBottom: '20px',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              📊 Player Analysis Results (OP.GG Style)
            </h2>
            
            <div style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
              {/* Raw Data Display */}
              <div style={{
                background: '#334155',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{ color: '#60a5fa', marginBottom: '12px' }}>🔍 Raw Backend Data</h3>
                <pre style={{
                  background: '#1e293b',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(analysisData, null, 2)}
                </pre>
              </div>

              {/* Champion Performance - OP.GG Style */}
              <div style={{
                background: '#334155',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{ color: '#60a5fa', marginBottom: '12px' }}>🏆 Champion Performance</h3>
                {analysisData.championPerformance?.firstTimeChampions?.length > 0 ? (
                  <div>
                    <p style={{ marginBottom: '12px', color: '#94a3b8' }}>
                      Found {analysisData.championPerformance.firstTimeChampions.length} champions
                    </p>
                                         {analysisData.championPerformance.firstTimeChampions.slice(0, 5).map((champ: any, index: number) => (
                      <div key={index} style={{
                        background: '#1e293b',
                        padding: '8px 12px',
                        margin: '6px 0',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: '500' }}>{champ.championName}</span>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {Math.round(champ.winRate * 100)}% WR | {champ.kda?.toFixed(1)} KDA
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    No champion performance data available
                  </p>
                )}
              </div>

              {/* Player Stats - OP.GG Style */}
              <div style={{
                background: '#334155',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h3 style={{ color: '#60a5fa', marginBottom: '12px' }}>📈 Player Statistics</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  <div style={{
                    background: '#1e293b',
                    padding: '12px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#34d399' }}>
                      {Math.round((analysisData.championPerformance?.overallPerformanceScore || 0) * 100)}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Performance Score</div>
                  </div>
                  
                  <div style={{
                    background: '#1e293b',
                    padding: '12px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
                      {analysisData.playtimeGaps?.gaps?.length || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Playtime Gaps</div>
                  </div>
                  
                  <div style={{
                    background: '#1e293b',
                    padding: '12px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#8b5cf6' }}>
                      {analysisData.summonerSpellUsage?.spellPlacementChanges?.length || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Spell Changes</div>
                  </div>
                  
                  <div style={{
                    background: '#1e293b',
                    padding: '12px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>
                      {Math.round((analysisData.playtimeGaps?.totalGapScore || 0) * 100)}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Suspicion Level</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary - OP.GG Style */}
            <div style={{
              background: '#334155',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '20px',
              border: '1px solid #475569'
            }}>
              <h3 style={{ color: '#60a5fa', marginBottom: '12px' }}>📋 Analysis Summary</h3>
              <div style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                <p><strong>Player:</strong> {playerName}</p>
                <p><strong>Data Status:</strong> {
                  Object.keys(analysisData).length > 0 
                    ? '✅ Data received from backend' 
                    : '❌ No data received'
                }</p>
                <p><strong>Analysis Factors:</strong> {
                  [
                    analysisData.championPerformance && '🏆 Champion Performance',
                    analysisData.playtimeGaps && '⏰ Playtime Gaps', 
                    analysisData.summonerSpellUsage && '🔧 Summoner Spells'
                  ].filter(Boolean).join(', ') || 'None detected'
                }</p>
              </div>
            </div>
          </div>
        )}



        {unifiedData && (
          <UnifiedSmurfAnalysis data={unifiedData} />
        )}
      </AppContainer>
    </ErrorBoundary>
  );
}

export default App;
