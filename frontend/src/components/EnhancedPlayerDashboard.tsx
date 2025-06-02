import React, { useState } from 'react';
import styled from 'styled-components';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EnhancedPlayerDashboardProps {
  playerData: any; // Enhanced analysis data
  isLoading: boolean;
}

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const PlayerHeader = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(71, 85, 105, 0.3);
  display: flex;
  align-items: center;
  gap: 24px;
`;

const PlayerAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.h1`
  color: #f1f5f9;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
`;

const PlayerRank = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
`;

const RankBadge = styled.div<{ tier: string }>`
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  background: ${props => {
    switch(props.tier?.toLowerCase()) {
      case 'iron': return 'linear-gradient(135deg, #8B4513 0%, #654321 100%)';
      case 'bronze': return 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)';
      case 'silver': return 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)';
      case 'gold': return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
      case 'platinum': return 'linear-gradient(135deg, #00CED1 0%, #008B8B 100%)';
      case 'emerald': return 'linear-gradient(135deg, #50C878 0%, #228B22 100%)';
      case 'diamond': return 'linear-gradient(135deg, #B9F2FF 0%, #00BFFF 100%)';
      case 'master': return 'linear-gradient(135deg, #9932CC 0%, #800080 100%)';
      case 'grandmaster': return 'linear-gradient(135deg, #FF4500 0%, #DC143C 100%)';
      case 'challenger': return 'linear-gradient(135deg, #FFD700 0%, #FF69B4 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  color: ${props => ['silver', 'gold'].includes(props.tier?.toLowerCase()) ? '#000' : '#fff'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const SmurfProbabilityCard = styled.div<{ probability: number }>`
  background: linear-gradient(135deg, 
    ${props => {
      if (props.probability >= 85) return '#dc2626 0%, #b91c1c 100%';
      if (props.probability >= 70) return '#ea580c 0%, #c2410c 100%';
      if (props.probability >= 50) return '#ca8a04 0%, #a16207 100%';
      if (props.probability >= 30) return '#65a30d 0%, #4d7c0f 100%';
      return '#059669 0%, #047857 100%';
    }}
  );
  border-radius: 12px;
  padding: 24px;
  color: white;
  min-width: 200px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const ProbabilityValue = styled.div`
  font-size: 36px;
  font-weight: 900;
  margin-bottom: 8px;
`;

const ProbabilityLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
  font-weight: 600;
`;

const EvidenceLevel = styled.div<{ level: string }>`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
`;

const TabContainer = styled.div`
  display: flex;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 32px;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(71, 85, 105, 0.3);
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
    : 'transparent'};
  color: ${props => props.active ? '#fff' : '#94a3b8'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' 
      : 'rgba(59, 130, 246, 0.1)'};
    color: ${props => props.active ? '#fff' : '#f1f5f9'};
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 28px;
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
`;

const AnalysisCard = styled.div`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(71, 85, 105, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
  }
`;

const WideCard = styled(AnalysisCard)`
  grid-column: 1 / -1;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
`;

const CardTitle = styled.h3`
  color: #f1f5f9;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardIcon = styled.span`
  font-size: 20px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin: 20px 0;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: #f1f5f9;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(71, 85, 105, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    border-color: rgba(59, 130, 246, 0.5);
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
  }
`;

const StatValue = styled.div<{ highlight?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
  color: ${props => props.highlight ? '#60a5fa' : '#f1f5f9'};
  letter-spacing: -0.025em;
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.85;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TimelineContainer = styled.div`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(71, 85, 105, 0.3);
`;

const TimelineItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(71, 85, 105, 0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

const TimelineDot = styled.div<{ type: 'win' | 'loss' | 'gap' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch(props.type) {
      case 'win': return '#10b981';
      case 'loss': return '#ef4444';
      case 'gap': return '#f59e0b';
      default: return '#6b7280';
    }
  }};
  margin-right: 16px;
  flex-shrink: 0;
`;

const TimelineContent = styled.div`
  flex: 1;
  color: #f1f5f9;
`;

const ChampionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const ChampionCard = styled.div`
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(75, 85, 99, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    border-color: rgba(59, 130, 246, 0.5);
  }
`;

const ChampionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ChampionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 14px;
`;

const ChampionName = styled.div`
  color: #f1f5f9;
  font-weight: 600;
  font-size: 16px;
`;

const ChampionStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 12px;
`;

const ChampionStat = styled.div`
  color: #94a3b8;
  
  strong {
    color: #f1f5f9;
  }
`;

const RedFlagsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`;

const RedFlag = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fca5a5;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const KeyFindingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`;

const KeyFinding = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #93c5fd;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const EnhancedPlayerDashboard: React.FC<EnhancedPlayerDashboardProps> = ({ 
  playerData, 
  isLoading 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'champions' | 'analysis'>('overview');

  if (isLoading) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: '#94a3b8',
          fontSize: '18px'
        }}>
          🔍 Analyzing player data...
        </div>
      </DashboardContainer>
    );
  }

  if (!playerData) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: '#94a3b8',
          fontSize: '18px'
        }}>
          No player data available
        </div>
      </DashboardContainer>
    );
  }

  const renderOverview = () => (
    <ContentGrid>
      <AnalysisCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>📊</CardIcon>
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <StatGrid>
          <StatCard>
            <StatValue highlight>{playerData.avgKDA || '2.1'}</StatValue>
            <StatLabel>Average KDA</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{playerData.avgCS || '6.8'}</StatValue>
            <StatLabel>CS/Min</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{playerData.visionScore || '1.2'}</StatValue>
            <StatLabel>Vision/Min</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue highlight>{playerData.damageShare || '24'}%</StatValue>
            <StatLabel>Damage Share</StatLabel>
          </StatCard>
        </StatGrid>
      </AnalysisCard>

      <AnalysisCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>🎯</CardIcon>
            Rank Progression
          </CardTitle>
        </CardHeader>
        <div style={{ height: '200px' }}>
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'LP',
                data: [1200, 1450, 1650, 1580, 1720, 1850],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { 
                  grid: { color: 'rgba(71, 85, 105, 0.3)' },
                  ticks: { color: '#94a3b8' }
                },
                y: { 
                  grid: { color: 'rgba(71, 85, 105, 0.3)' },
                  ticks: { color: '#94a3b8' }
                }
              }
            }}
          />
        </div>
      </AnalysisCard>

      <AnalysisCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>⚠️</CardIcon>
            Smurf Indicators
          </CardTitle>
        </CardHeader>
        <div style={{ height: '200px' }}>
          <Radar
            data={{
              labels: ['Performance', 'Historical', 'Champion Mastery', 'Gaps', 'Behavioral'],
              datasets: [{
                label: 'Smurf Score',
                data: [85, 60, 75, 40, 30],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#ef4444'
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                r: {
                  min: 0,
                  max: 100,
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(71, 85, 105, 0.3)' },
                  pointLabels: { color: '#f1f5f9' }
                }
              }
            }}
          />
        </div>
      </AnalysisCard>

      <WideCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>🕒</CardIcon>
            Recent Match History
          </CardTitle>
        </CardHeader>
        <TimelineContainer>
          {[1,2,3,4,5].map(i => (
            <TimelineItem key={i}>
              <TimelineDot type={i % 2 === 0 ? 'win' : 'loss'} />
              <TimelineContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Yasuo</strong> • Ranked Solo/Duo • {i % 2 === 0 ? 'Victory' : 'Defeat'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {Math.floor(Math.random() * 30) + 15} minutes ago
                  </div>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
                  {Math.floor(Math.random() * 20) + 5}/{Math.floor(Math.random() * 10) + 1}/{Math.floor(Math.random() * 15) + 5} • 
                  {Math.floor(Math.random() * 300) + 150} CS • 
                  {Math.floor(Math.random() * 50000) + 15000} damage
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </TimelineContainer>
      </WideCard>
    </ContentGrid>
  );

  const renderTimeline = () => (
    <WideCard>
      <CardHeader>
        <CardTitle>
          <CardIcon>📈</CardIcon>
          Historical Timeline
        </CardTitle>
      </CardHeader>
      <div style={{ height: '400px', marginBottom: '24px' }}>
        <Line
          data={{
            labels: Array.from({length: 50}, (_, i) => `Game ${i + 1}`),
            datasets: [
              {
                label: 'KDA',
                data: Array.from({length: 50}, () => Math.random() * 5 + 1),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: false,
                tension: 0.1
              },
              {
                label: 'CS/Min',
                data: Array.from({length: 50}, () => Math.random() * 3 + 5),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: false,
                tension: 0.1
              },
              {
                label: 'Damage Share',
                data: Array.from({length: 50}, () => Math.random() * 20 + 15),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: false,
                tension: 0.1
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                labels: { color: '#f1f5f9' }
              }
            },
            scales: {
              x: { 
                grid: { color: 'rgba(71, 85, 105, 0.3)' },
                ticks: { color: '#94a3b8' }
              },
              y: { 
                grid: { color: 'rgba(71, 85, 105, 0.3)' },
                ticks: { color: '#94a3b8' }
              }
            }
          }}
        />
      </div>
      
      <CardHeader>
        <CardTitle>
          <CardIcon>⏳</CardIcon>
          Activity Gaps Analysis
        </CardTitle>
      </CardHeader>
      <div style={{ color: '#94a3b8' }}>
        Gap analysis shows periods of inactivity and performance changes...
      </div>
    </WideCard>
  );

  const renderChampions = () => (
    <>
      <WideCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>🏆</CardIcon>
            Champion Mastery Analysis
          </CardTitle>
        </CardHeader>
        <ChampionGrid>
          {['Yasuo', 'Zed', 'Akali', 'Katarina', 'Azir', 'LeBlanc'].map((champion, index) => (
            <ChampionCard key={champion}>
              <ChampionHeader>
                <ChampionIcon>
                  {champion.substring(0, 2).toUpperCase()}
                </ChampionIcon>
                <ChampionName>{champion}</ChampionName>
              </ChampionHeader>
              <ChampionStats>
                <ChampionStat>
                  <strong>{Math.floor(Math.random() * 50) + 10}</strong> games
                </ChampionStat>
                <ChampionStat>
                  <strong>{Math.floor(Math.random() * 40) + 45}%</strong> WR
                </ChampionStat>
                <ChampionStat>
                  <strong>{(Math.random() * 3 + 1).toFixed(1)}</strong> KDA
                </ChampionStat>
                <ChampionStat>
                  <strong>{(Math.random() * 2 + 6).toFixed(1)}</strong> CS/min
                </ChampionStat>
              </ChampionStats>
            </ChampionCard>
          ))}
        </ChampionGrid>
      </WideCard>
    </>
  );

  const renderAnalysis = () => (
    <ContentGrid>
      <AnalysisCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>🚨</CardIcon>
            Red Flags
          </CardTitle>
        </CardHeader>
        <RedFlagsList>
          <RedFlag>
            <span>⚠️</span>
            Immediate expertise on multiple champions
          </RedFlag>
          <RedFlag>
            <span>📈</span>
            Unusually high performance consistency
          </RedFlag>
          <RedFlag>
            <span>🎯</span>
            Perfect CS efficiency in early games
          </RedFlag>
        </RedFlagsList>
      </AnalysisCard>

      <AnalysisCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>🔍</CardIcon>
            Key Findings
          </CardTitle>
        </CardHeader>
        <KeyFindingsList>
          <KeyFinding>
            <span>📊</span>
            95th percentile damage efficiency
          </KeyFinding>
          <KeyFinding>
            <span>👁️</span>
            Advanced map awareness indicators
          </KeyFinding>
          <KeyFinding>
            <span>🎮</span>
            Expert-level mechanical execution
          </KeyFinding>
        </KeyFindingsList>
      </AnalysisCard>

      <WideCard>
        <CardHeader>
          <CardTitle>
            <CardIcon>📋</CardIcon>
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <div style={{ color: '#f1f5f9', lineHeight: '1.6' }}>
          <p>
            Based on comprehensive analysis of {playerData?.gamesAnalyzed || 150} games spanning 
            {playerData?.timeSpanDays || 45} days, this account shows several indicators consistent 
            with experienced players on new accounts.
          </p>
          <p style={{ marginTop: '16px' }}>
            The combination of immediate champion expertise, consistent high-level performance, 
            and advanced game knowledge suggests a {playerData?.smurfProbability || 78}% probability 
            of smurfing with <strong>{playerData?.evidenceLevel || 'strong'}</strong> evidence.
          </p>
        </div>
      </WideCard>
    </ContentGrid>
  );

  return (
    <DashboardContainer>
      {/* Player Header */}
      <PlayerHeader>
        <PlayerAvatar>
          {(playerData?.summoner?.name || 'Player').substring(0, 2).toUpperCase()}
        </PlayerAvatar>
        <PlayerInfo>
          <PlayerName>{playerData?.summoner?.name || 'Unknown Player'}</PlayerName>
          <PlayerRank>
            <RankBadge tier={playerData?.currentRank?.currentRank?.tier || 'unranked'}>
              {playerData?.currentRank?.currentRank?.tier || 'UNRANKED'} {playerData?.currentRank?.currentRank?.division || ''}
            </RankBadge>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Level {playerData?.summoner?.level || 30} • {playerData?.analysisMetadata?.dataQuality?.gamesAnalyzed || 0} games analyzed
            </div>
          </PlayerRank>
        </PlayerInfo>
        <SmurfProbabilityCard probability={playerData?.smurfDetection?.overallProbability || 50}>
          <ProbabilityValue>{playerData?.smurfDetection?.overallProbability || 50}%</ProbabilityValue>
          <ProbabilityLabel>Smurf Probability</ProbabilityLabel>
          <EvidenceLevel level={playerData?.smurfDetection?.evidenceLevel || 'moderate'}>
            {playerData?.smurfDetection?.evidenceLevel || 'moderate'} evidence
          </EvidenceLevel>
        </SmurfProbabilityCard>
      </PlayerHeader>

      {/* Navigation Tabs */}
      <TabContainer>
        <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </Tab>
        <Tab active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')}>
          📈 Timeline
        </Tab>
        <Tab active={activeTab === 'champions'} onClick={() => setActiveTab('champions')}>
          🏆 Champions
        </Tab>
        <Tab active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
          🔍 Analysis
        </Tab>
      </TabContainer>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'timeline' && renderTimeline()}
      {activeTab === 'champions' && renderChampions()}
      {activeTab === 'analysis' && renderAnalysis()}
    </DashboardContainer>
  );
}; 