import React, { useState } from 'react';
import { DetailedAnalysis } from './components/DetailedAnalysis';
import { apiService } from './services/api';
import styled from 'styled-components';
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

function App() {
  const [playerName, setPlayerName] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!playerName.trim()) {
      setError('Please enter a Riot ID');
      return;
    }

    // Check if it's a Riot ID format
    if (!playerName.includes('#')) {
      setError(`Please enter a valid Riot ID in the format: GameName#TAG

Examples:
• Reinegade#Rei  
• YourName#NA1
• Player#123

You can find your Riot ID in your League client profile.`);
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisData(null);
    
    try {
      console.log(`🔍 Searching for player: ${playerName}`);
      
      // Try comprehensive analysis first (best endpoint)
      const result = await apiService.analyzeComprehensive(playerName, 'na1');
      
      if (result.success && result.data) {
        console.log(`✅ Player found: ${playerName}`);
        console.log('📊 Backend response data structure:', result.data);
        
        // Transform backend data to match DetailedAnalysis component expectations
        const transformedData = {
          championPerformance: result.data.analysisFactors?.championPerformance || {
            firstTimeChampions: [],
            overallPerformanceScore: 0
          },
          summonerSpellUsage: result.data.analysisFactors?.summonerSpellUsage || {
            spellPlacementChanges: [],
            patternChangeScore: 0
          },
          playtimeGaps: result.data.analysisFactors?.playtimeGaps || {
            gaps: [],
            totalGapScore: 0
          }
        };
        
        console.log('🔄 Transformed data for component:', transformedData);
        setAnalysisData(transformedData);
      } else {
        throw new Error(result.error?.message || 'Analysis failed');
      }
      
    } catch (error: any) {
      console.error('❌ Analysis failed:', error);
      
      // Handle specific error types based on error object properties
      if (error.type === 'PLAYER_NOT_FOUND') {
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

${error.message || 'Please try again or verify the Riot ID format.'}`);
        }
      }
    } finally {
      setLoading(false);
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
      setDebugInfo({
        apiUrl: process.env.REACT_APP_API_URL || 'https://smurfgaurd-production.up.railway.app/api',
        healthCheck: health,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      setDebugInfo({
        apiUrl: process.env.REACT_APP_API_URL || 'https://smurfgaurd-production.up.railway.app/api',
        error: error.message,
        type: error.type,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
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

      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {loading && (
        <LoadingMessage>
          Analyzing player data for suspicious patterns...
        </LoadingMessage>
      )}

      {analysisData && (
        <DetailedAnalysis analysis={analysisData} />
      )}
    </AppContainer>
  );
}

export default App;
