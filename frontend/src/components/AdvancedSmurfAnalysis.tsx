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
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 15px;
  color: #ef4444;
  text-align: center;
  margin-bottom: 20px;
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
      // Try both the new endpoint and fallback to existing endpoints
      const endpoints = [
        `/api/analyze/champion-outliers/${encodeURIComponent(playerName)}`,
        `https://smurfgaurd-production.up.railway.app/api/analyze/champion-outliers/${encodeURIComponent(playerName)}`,
        `/api/analyze/advanced-smurf/${encodeURIComponent(playerName)}`
      ];

      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint);
          if (response.ok) break;
        } catch (e) {
          continue; // Try next endpoint
        }
      }

      if (!response || !response.ok) {
        throw new Error('Failed to fetch analysis data');
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        throw new Error(result.message || 'Analysis failed');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
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
      <Header>
        <Title>Advanced Smurf Detection</Title>
        <Subtitle>Detect dramatic playstyle changes and account switching patterns</Subtitle>
        
        <SearchSection>
          <SearchInput
            type="text"
            placeholder="Enter summoner name..."
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