import React, { useState } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/api';
import { SmurfAnalysis } from '../types';

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
      case 'critical': return 'rgba(239, 68, 68, 0.2)';
      case 'high': return 'rgba(245, 158, 11, 0.2)';
      case 'medium': return 'rgba(52, 211, 153, 0.2)';
      case 'low': return 'rgba(100, 116, 139, 0.2)';
      default: return 'rgba(100, 116, 139, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#34d399';
      case 'low': return '#64748b';
      default: return '#64748b';
    }
  }};
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  color: #ef4444;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 1.1rem;
`;

export const AdvancedSmurfAnalysis: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<SmurfAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisData(null);

    try {
      const result = await apiService.analyzePlayer(playerName, 'na1');
      
      if (result) {
        setAnalysisData(result);
      } else {
        throw new Error('No analysis data received');
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
                <SummaryValue>{analysisData.totalGamesAnalyzed}</SummaryValue>
                <SummaryLabel>Games Analyzed</SummaryLabel>
              </SummaryItem>
              <SummaryItem>
                <SummaryValue suspicious={analysisData.smurfProbability > 0.7}>
                  {(analysisData.smurfProbability * 100).toFixed(1)}%
                </SummaryValue>
                <SummaryLabel>Smurf Probability</SummaryLabel>
              </SummaryItem>
              <SummaryItem>
                <SummaryValue>{analysisData.reasons.length}</SummaryValue>
                <SummaryLabel>Suspicious Indicators</SummaryLabel>
              </SummaryItem>
              <SummaryItem>
                <SummaryValue>{analysisData.championStats.length}</SummaryValue>
                <SummaryLabel>Champions Analyzed</SummaryLabel>
              </SummaryItem>
            </SummaryGrid>
          </SummaryCard>

          {analysisData.reasons.length > 0 && (
            <DataTable>
              <thead>
                <tr>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Severity</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Confidence</TableHeader>
                </tr>
              </thead>
              <tbody>
                {analysisData.reasons.map((reason, index) => (
                  <TableRow key={index} highlighted={reason.severity === 'CRITICAL'}>
                    <TableCell>{reason.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={reason.severity.toLowerCase()}>
                        {reason.severity}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{reason.description}</TableCell>
                    <TableCell>{(reason.confidence * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          )}

          {analysisData.championStats.length > 0 && (
            <DataTable>
              <thead>
                <tr>
                  <TableHeader>Champion</TableHeader>
                  <TableHeader>Win Rate</TableHeader>
                  <TableHeader>KDA</TableHeader>
                  <TableHeader>CS/min</TableHeader>
                  <TableHeader>Games</TableHeader>
                  <TableHeader>Mastery</TableHeader>
                </tr>
              </thead>
              <tbody>
                {analysisData.championStats.map((champ, index) => (
                  <TableRow key={index} highlighted={champ.winRate > 0.6}>
                    <TableCell>{champ.championName}</TableCell>
                    <TableCell>{(champ.winRate * 100).toFixed(1)}%</TableCell>
                    <TableCell>{champ.kda.toFixed(2)}</TableCell>
                    <TableCell>{champ.csPerMinute.toFixed(1)}</TableCell>
                    <TableCell>{champ.gamesPlayed}</TableCell>
                    <TableCell>Level {champ.masteryLevel}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </>
      )}
    </Container>
  );
}; 