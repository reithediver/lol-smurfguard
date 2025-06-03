import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface PlayerComparison {
  metric: string;
  playerValue: number;
  rankAverage: number;
  percentile: number;
  deviation: number;
  status: 'far_below' | 'below_average' | 'average' | 'above_average' | 'exceptional';
  suspiciousLevel: number;
}

interface PlaystyleShift {
  timestamp: Date;
  type: 'gradual' | 'sudden' | 'dramatic';
  confidence: number;
  description: string;
  suspicionScore: number;
}

interface ChampionEvolution {
  championName: string;
  suspicionFlags: {
    tooGoodTooFast: boolean;
    suddenExpertise: boolean;
    metaShift: boolean;
    complexityJump: boolean;
  };
}

interface AdvancedAnalysisData {
  performanceOutliers: PlayerComparison[];
  playstyleShifts: PlaystyleShift[];
  championMasteryAnomalies: ChampionEvolution[];
  summary: {
    totalChampionsAnalyzed: number;
    suspiciousPerformanceCount: number;
    outlierPerformanceCount: number;
    dramaticShiftsDetected: number;
    overallSuspicionScore: number;
  };
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #e2e8f0;
  background: #0f172a;
  min-height: 100vh;
`;

const InfoBanner = styled.div`
  background: linear-gradient(135deg, #1e40af, #3730a3);
  border: 1px solid #3b82f6;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  color: #e0e7ff;
`;

const InfoTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #ddd6fe;
  font-weight: 600;
`;

const InfoText = styled.p`
  margin: 5px 0;
  line-height: 1.5;
  color: #c7d2fe;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: 12px;
  border: 1px solid #475569;
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
  margin-bottom: 20px;
`;

const SearchSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 400px;
  padding: 12px 16px;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 16px;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &::placeholder {
    color: #64748b;
  }
`;

const AnalyzeButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    background: #374151;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SummaryCard = styled.div`
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #475569;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const SummaryItem = styled.div`
  text-align: center;
  padding: 15px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  border: 1px solid #334155;
`;

const SummaryValue = styled.div<{ suspicious?: boolean }>`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.suspicious ? '#ef4444' : '#34d399'};
  margin-bottom: 5px;
`;

const SummaryLabel = styled.div`
  color: #94a3b8;
  font-size: 0.9rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 30px 0 20px 0;
  color: #f1f5f9;
  border-bottom: 2px solid #334155;
  padding-bottom: 10px;
`;

const DataTable = styled.table`
  width: 100%;
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #334155;
  margin-bottom: 30px;
`;

const TableHeader = styled.th`
  background: #334155;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #f1f5f9;
  border-bottom: 1px solid #475569;
`;

const TableRow = styled.tr<{ highlighted?: boolean }>`
  background: ${props => props.highlighted ? 'rgba(239, 68, 68, 0.1)' : 'transparent'};
  border-bottom: 1px solid #334155;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }
`;

const TableCell = styled.td<{ status?: string }>`
  padding: 12px 15px;
  color: ${props => {
    switch (props.status) {
      case 'exceptional': return '#ef4444';
      case 'above_average': return '#f59e0b';
      case 'average': return '#34d399';
      case 'below_average': return '#64748b';
      default: return '#e2e8f0';
    }
  }};
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'exceptional': return 'rgba(239, 68, 68, 0.2)';
      case 'above_average': return 'rgba(245, 158, 11, 0.2)';
      case 'average': return 'rgba(52, 211, 153, 0.2)';
      case 'below_average': return 'rgba(100, 116, 139, 0.2)';
      default: return 'rgba(100, 116, 139, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'exceptional': return '#ef4444';
      case 'above_average': return '#f59e0b';
      case 'average': return '#34d399';
      case 'below_average': return '#64748b';
      default: return '#64748b';
    }
  }};
`;

const SuspicionBar = styled.div<{ level: number }>`
  width: 100%;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${props => props.level}%;
    height: 100%;
    background: ${props => 
      props.level > 80 ? '#ef4444' :
      props.level > 60 ? '#f59e0b' :
      props.level > 40 ? '#eab308' :
      '#34d399'
    };
    transition: width 0.3s;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  color: #60a5fa;
  font-size: 1.2rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fef2f2;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #f87171;
  white-space: pre-line;
  line-height: 1.6;
  
  strong {
    color: #fecaca;
  }
`;

const ChampionFlag = styled.span<{ flag: string }>`
  display: inline-block;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${props => {
    switch (props.flag) {
      case 'tooGoodTooFast': return 'rgba(239, 68, 68, 0.2)';
      case 'suddenExpertise': return 'rgba(245, 158, 11, 0.2)';
      case 'metaShift': return 'rgba(168, 85, 247, 0.2)';
      case 'complexityJump': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(100, 116, 139, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.flag) {
      case 'tooGoodTooFast': return '#ef4444';
      case 'suddenExpertise': return '#f59e0b';
      case 'metaShift': return '#a855f7';
      case 'complexityJump': return '#ef4444';
      default: return '#64748b';
    }
  }};
`;

export const AdvancedSmurfAnalysis: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<AdvancedAnalysisData | null>(null);

  const handleAnalyze = async () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisData(null);

    try {
      // Use the Railway backend URL consistently
      const baseURL = 'https://smurfgaurd-production.up.railway.app';
      const endpoints = [
        `${baseURL}/api/analyze/champion-outliers/${encodeURIComponent(playerName)}`,
        `${baseURL}/api/analyze/advanced-smurf/${encodeURIComponent(playerName)}`,
        `${baseURL}/api/analyze/basic/${encodeURIComponent(playerName)}`
      ];

      let response = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log(`Success with endpoint: ${endpoint}`);
            break;
          } else {
            console.log(`Failed with status ${response.status}: ${endpoint}`);
            
            // Handle specific error cases
            if (response.status === 403) {
              lastError = `API Access Forbidden (403): The Development API key cannot access data for famous players like "${playerName}". Try a less well-known summoner name, or check our Demo tab for working examples with challenger data.`;
            } else if (response.status === 404) {
              lastError = `Player "${playerName}" not found. Please check the spelling and make sure the player exists in the NA region.`;
            } else if (response.status === 429) {
              lastError = `Rate limit exceeded. Please wait a moment and try again.`;
            } else if (response.status === 500) {
              // Try to get the error details from the response
              try {
                const errorData = await response.json();
                if (errorData.details && errorData.details.includes('403')) {
                  lastError = `API Access Restricted: The Development API key cannot access data for "${playerName}". This is a Riot Games API limitation for famous players. Try a different summoner name or check our Demo tab for working examples.`;
                } else {
                  lastError = `Server Error (500): ${errorData.message || 'Internal server error'}`;
                }
              } catch {
                lastError = `Server Error (500): Internal server error`;
              }
            } else {
              lastError = `HTTP ${response.status}: ${response.statusText}`;
            }
          }
        } catch (e) {
          console.log(`Network error with endpoint: ${endpoint}`, e);
          lastError = e instanceof Error ? e.message : 'Network error';
          continue; // Try next endpoint
        }
      }

      if (!response || !response.ok) {
        throw new Error(lastError || 'All endpoints failed to respond');
      }

      // Verify we got JSON, not HTML
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Backend may be down.');
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        // Handle API-specific error messages
        let errorMessage = result.message || result.error || 'Analysis failed';
        
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          errorMessage = `API Access Restricted: The Development API key cannot analyze "${playerName}". This is a Riot Games limitation for famous players. Try a different summoner name or check our Demo tab for working examples with challenger data.`;
        }
        
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('Analysis error:', error);
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Add helpful suggestion for common API limitations
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || 
          errorMessage.toLowerCase().includes('famous') || 
          ['faker', 'doublelift', 'bjergsen', 'sneaky', 'imaqtpie'].includes(playerName.toLowerCase())) {
        errorMessage += '\n\n💡 Tip: Try searching for a less well-known summoner name, or visit our Demo tab to see the advanced analysis features working with challenger data.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAnalyze();
    }
  };

  const getChampionFlags = (champion: ChampionEvolution) => {
    const flags = [];
    if (champion.suspicionFlags.tooGoodTooFast) flags.push('tooGoodTooFast');
    if (champion.suspicionFlags.suddenExpertise) flags.push('suddenExpertise');
    if (champion.suspicionFlags.metaShift) flags.push('metaShift');
    if (champion.suspicionFlags.complexityJump) flags.push('complexityJump');
    return flags;
  };

  return (
    <Container>
      <InfoBanner>
        <InfoTitle>ℹ️ API Access Information</InfoTitle>
        <InfoText>
          <strong>Current Limitation:</strong> The Development API key cannot access data for famous players (Faker, Doublelift, etc.) due to Riot Games restrictions.
        </InfoText>
        <InfoText>
          <strong>What works:</strong> Analysis of less well-known summoner names in NA region. Try searching for regular players instead of pro players.
        </InfoText>
        <InfoText>
          <strong>See it working:</strong> Visit the <strong>Demo</strong> tab to see the full advanced analysis system working with challenger data.
        </InfoText>
      </InfoBanner>

      <Header>
        <Title>Advanced Smurf Detection</Title>
        <Subtitle>Detect dramatic playstyle changes and account switching patterns</Subtitle>
        
        <SearchSection>
          <SearchInput
            type="text"
            placeholder="Enter summoner name (try non-famous players)..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <AnalyzeButton onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Player'}
          </AnalyzeButton>
        </SearchSection>
      </Header>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {loading && (
        <LoadingSpinner>
          Analyzing player data for suspicious patterns...
        </LoadingSpinner>
      )}

      {analysisData && (
        <>
          <SummaryCard>
            <SectionTitle>Analysis Summary</SectionTitle>
            <SummaryGrid>
              <SummaryItem>
                <SummaryValue>{analysisData.summary.totalChampionsAnalyzed}</SummaryValue>
                <SummaryLabel>Champions Analyzed</SummaryLabel>
              </SummaryItem>
              <SummaryItem>
                <SummaryValue suspicious={analysisData.summary.outlierPerformanceCount > 0}>
                  {analysisData.summary.outlierPerformanceCount}
                </SummaryValue>
                <SummaryLabel>Performance Outliers (95th+ percentile)</SummaryLabel>
              </SummaryItem>
              <SummaryItem>
                <SummaryValue suspicious={analysisData.summary.dramaticShiftsDetected > 0}>
                  {analysisData.summary.dramaticShiftsDetected}
                </SummaryValue>
                <SummaryLabel>Dramatic Playstyle Shifts</SummaryLabel>
              </SummaryItem>
              <SummaryItem>
                <SummaryValue suspicious={analysisData.summary.overallSuspicionScore > 50}>
                  {analysisData.summary.overallSuspicionScore.toFixed(0)}%
                </SummaryValue>
                <SummaryLabel>Overall Suspicion Score</SummaryLabel>
              </SummaryItem>
            </SummaryGrid>
          </SummaryCard>

          {analysisData.performanceOutliers.length > 0 && (
            <>
              <SectionTitle>Performance vs Rank Benchmarks</SectionTitle>
              <DataTable>
                <thead>
                  <tr>
                    <TableHeader>Metric</TableHeader>
                    <TableHeader>Player Value</TableHeader>
                    <TableHeader>Rank Average</TableHeader>
                    <TableHeader>Percentile</TableHeader>
                    <TableHeader>Deviation</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Suspicion Level</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.performanceOutliers.map((comparison, index) => (
                    <TableRow key={index} highlighted={comparison.percentile > 95}>
                      <TableCell>{comparison.metric}</TableCell>
                      <TableCell>{comparison.playerValue.toFixed(2)}</TableCell>
                      <TableCell>{comparison.rankAverage.toFixed(2)}</TableCell>
                      <TableCell status={comparison.status}>
                        {comparison.percentile.toFixed(1)}th
                      </TableCell>
                      <TableCell>{(comparison.deviation * 100).toFixed(1)}%</TableCell>
                      <TableCell>
                        <StatusBadge status={comparison.status}>
                          {comparison.status.replace('_', ' ')}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <SuspicionBar level={comparison.suspiciousLevel} />
                        <span style={{ fontSize: '0.8rem', marginLeft: '8px' }}>
                          {comparison.suspiciousLevel.toFixed(0)}/100
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </>
          )}

          {analysisData.playstyleShifts.length > 0 && (
            <>
              <SectionTitle>Dramatic Playstyle Changes</SectionTitle>
              <DataTable>
                <thead>
                  <tr>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Change Type</TableHeader>
                    <TableHeader>Description</TableHeader>
                    <TableHeader>Confidence</TableHeader>
                    <TableHeader>Suspicion Score</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.playstyleShifts.map((shift, index) => (
                    <TableRow key={index} highlighted={shift.type === 'dramatic'}>
                      <TableCell>{new Date(shift.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={shift.type === 'dramatic' ? 'exceptional' : 'above_average'}>
                          {shift.type}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{shift.description}</TableCell>
                      <TableCell>{(shift.confidence * 100).toFixed(1)}%</TableCell>
                      <TableCell>
                        <SuspicionBar level={shift.suspicionScore} />
                        <span style={{ fontSize: '0.8rem', marginLeft: '8px' }}>
                          {shift.suspicionScore.toFixed(0)}/100
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </>
          )}

          {analysisData.championMasteryAnomalies.length > 0 && (
            <>
              <SectionTitle>Champion Mastery Anomalies</SectionTitle>
              <DataTable>
                <thead>
                  <tr>
                    <TableHeader>Champion</TableHeader>
                    <TableHeader>Suspicious Indicators</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.championMasteryAnomalies.map((champion, index) => (
                    <TableRow key={index} highlighted={true}>
                      <TableCell>{champion.championName}</TableCell>
                      <TableCell>
                        {getChampionFlags(champion).map(flag => (
                          <ChampionFlag key={flag} flag={flag}>
                            {flag === 'tooGoodTooFast' && '🔴 Too Good Too Fast'}
                            {flag === 'suddenExpertise' && '🟠 Sudden Expertise'}
                            {flag === 'metaShift' && '🟣 Meta Shift'}
                            {flag === 'complexityJump' && '🔴 Complexity Jump'}
                          </ChampionFlag>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </>
          )}

          {!analysisData.performanceOutliers.length && 
           !analysisData.playstyleShifts.length && 
           !analysisData.championMasteryAnomalies.length && (
            <SummaryCard>
              <SectionTitle>No Suspicious Activity Detected</SectionTitle>
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: '1.1rem' }}>
                This player shows normal progression patterns and performance within expected ranges for their rank.
              </p>
            </SummaryCard>
          )}
        </>
      )}
    </Container>
  );
}; 