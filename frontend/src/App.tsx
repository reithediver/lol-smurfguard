import React, { useState } from 'react';
import { DetailedAnalysis } from './components/DetailedAnalysis';
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

function App() {
  const [playerName, setPlayerName] = useState('');
  const [analysis, setAnalysis] = useState<SmurfAnalysis | null>(null);
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
      // TODO: Replace with actual API call when backend is ready
      // For now, use mock data
      setTimeout(() => {
        const mockAnalysis: SmurfAnalysis = {
          playerName: playerName,
          smurfProbability: Math.random(),
          championPerformance: {
            firstTimeChampions: [
              {
                championName: 'Yasuo',
                winRate: 0.85,
                kda: 4.2,
                csPerMinute: 8.5,
                suspicionLevel: 0.9
              },
              {
                championName: 'Zed',
                winRate: 0.9,
                kda: 5.1,
                csPerMinute: 9.2,
                suspicionLevel: 0.95
              }
            ],
            overallPerformanceScore: 0.85
          },
          summonerSpellUsage: {
            spellPlacementChanges: [
              {
                gameId: '1234567890',
                timestamp: new Date(),
                oldSpells: [4, 6] as [number, number],
                newSpells: [6, 4] as [number, number]
              }
            ],
            patternChangeScore: 0.8
          },
          playtimeGaps: {
            gaps: [
              {
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                durationHours: 168,
                suspicionLevel: 0.3
              }
            ],
            totalGapScore: 0.3
          }
        };
        setAnalysis(mockAnalysis);
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError('Failed to analyze player. Please try again.');
      setLoading(false);
    }
  };

  const getProbabilityLabel = (probability: number) => {
    if (probability >= 0.8) return 'Very High';
    if (probability >= 0.6) return 'High';
    if (probability >= 0.4) return 'Moderate';
    if (probability >= 0.2) return 'Low';
    return 'Very Low';
  };

  return (
    <AppContainer>
      <Header>
        <h1>League of Legends Smurf Detector</h1>
        <p>Analyze player behavior patterns to detect potential smurf accounts</p>
      </Header>

      <SearchSection>
        <SearchContainer>
          <PlayerInput
            type="text"
            placeholder="Enter player name (e.g., PlayerName#TAG)"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <AnalyzeButton 
            onClick={handleAnalyze} 
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Player'}
          </AnalyzeButton>
        </SearchContainer>
      </SearchSection>

      {error && <div style={{ color: '#ff4757', textAlign: 'center' }}>{error}</div>}

      {analysis && (
        <>
          <ProbabilityDisplay probability={analysis.smurfProbability}>
            <h2>Smurf Probability</h2>
            <ProbabilityValue>
              {Math.round(analysis.smurfProbability * 100)}%
            </ProbabilityValue>
            <ProbabilityLabel>
              {getProbabilityLabel(analysis.smurfProbability)}
            </ProbabilityLabel>
          </ProbabilityDisplay>

          <DetailedAnalysis analysis={analysis} />
        </>
      )}
    </AppContainer>
  );
}

export default App;
