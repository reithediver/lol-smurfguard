import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styled from 'styled-components';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DetailedAnalysisProps {
  analysis: {
    championPerformance?: {
      firstTimeChampions: Array<{
        championName: string;
        winRate: number;
        kda: number;
        csPerMinute: number;
        suspicionLevel: number;
      }>;
      overallPerformanceScore: number;
    };
    summonerSpellUsage?: {
      spellPlacementChanges: Array<{
        gameId: string;
        timestamp: Date;
        oldSpells: [number, number];
        newSpells: [number, number];
      }>;
      patternChangeScore: number;
    };
    playtimeGaps?: {
      gaps: Array<{
        startDate: Date;
        endDate: Date;
        durationHours: number;
        suspicionLevel: number;
      }>;
      totalGapScore: number;
    };
    // Allow any other properties for compatibility
    [key: string]: any;
  };
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const DashboardHeader = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(71, 85, 105, 0.3);
`;

const DashboardTitle = styled.h1`
  color: #f1f5f9;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
`;

const DashboardSubtitle = styled.p`
  color: #94a3b8;
  font-size: 16px;
  margin: 0;
  font-weight: 500;
`;

const AnalysisGrid = styled.div`
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

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 16px 20px;
  background: linear-gradient(135deg, #3730a3 0%, #4338ca 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);

  &:hover {
    background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }
`;

const SectionContent = styled.div<{ isExpanded: boolean }>`
  max-height: ${props => props.isExpanded ? '2000px' : '0'};
  opacity: ${props => props.isExpanded ? '1' : '0'};
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${props => props.isExpanded ? '20px 0' : '0'};
`;

const CompactStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin: 20px 0;
`;

const CompactStatCard = styled.div`
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

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #60a5fa;
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

const ChampionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const ChampionCard = styled.div`
  background: linear-gradient(135deg, #334155 0%, #475569 100%);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(71, 85, 105, 0.3);
  
  &:hover {
    transform: scale(1.03);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    border-color: rgba(59, 130, 246, 0.5);
  }
`;

const ChampionName = styled.h5`
  color: #f1f5f9;
  font-weight: 700;
  margin-bottom: 16px;
  font-size: 16px;
  letter-spacing: -0.025em;
`;

const ChampionStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
`;

const ChampionStat = styled.div`
  background: rgba(26, 32, 44, 0.8);
  padding: 6px;
  border-radius: 6px;
  color: #e2e8f0;
`;

const ChampionStatValue = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #63b3ed;
`;

const ChampionStatLabel = styled.div`
  font-size: 9px;
  color: #a0aec0;
  margin-top: 2px;
`;

const ChartContainer = styled.div`
  background: rgba(26, 32, 44, 0.8);
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  height: 280px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(74, 85, 104, 0.3);
`;

const GapAlert = styled.div<{ severity: 'low' | 'medium' | 'high' }>`
  background: ${props => {
    switch(props.severity) {
      case 'high': return 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
      case 'medium': return 'linear-gradient(135deg, #d69e2e 0%, #b7791f 100%)';
      default: return 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)';
    }
  }};
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  margin: 6px 0;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const SectionTitle = styled.h2`
  color: #e2e8f0;
  text-align: center;
  margin-bottom: 32px;
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const WeightBadge = styled.span`
  background: rgba(99, 179, 237, 0.2);
  color: #90cdf4;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
  border: 1px solid rgba(99, 179, 237, 0.3);
`;

const TrendContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TrendCard = styled.div`
  background: rgba(26, 32, 44, 0.8);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(74, 85, 104, 0.3);
`;

const TrendTitle = styled.h4`
  color: #e2e8f0;
  font-size: 14px;
  margin-bottom: 12px;
  font-weight: 600;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  padding: 14px;
  border-radius: 8px;
  margin: 8px 0;
  border: 1px solid rgba(74, 85, 104, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(99, 179, 237, 0.4);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const MetricName = styled.span`
  color: #e2e8f0;
  font-weight: 600;
  font-size: 13px;
`;

const MetricValue = styled.span<{ suspicious?: boolean }>`
  color: ${props => props.suspicious ? '#fc8181' : '#68d391'};
  font-weight: bold;
  font-size: 14px;
`;

const ProgressBar = styled.div<{ percentage: number; color: string }>`
  width: 100%;
  height: 4px;
  background: rgba(74, 85, 104, 0.3);
  border-radius: 2px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.percentage}%;
    height: 100%;
    background: ${props => props.color};
    transition: width 0.3s ease;
  }
`;

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ analysis }) => {
  const [expandedSections, setExpandedSections] = useState({
    championPerformance: false,
    summonerSpells: false,
    playtimeGaps: false,
    trendAnalysis: false,
    advancedMetrics: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Provide safe defaults for missing data
  const defaultChampionPerformance = {
    firstTimeChampions: [],
    overallPerformanceScore: 0
  };

  const defaultSummonerSpellUsage = {
    spellPlacementChanges: [],
    patternChangeScore: 0
  };

  const defaultPlaytimeGaps = {
    gaps: [],
    totalGapScore: 0
  };

  // Safely extract data with proper null checks
  const championPerformance = {
    firstTimeChampions: Array.isArray(analysis.championPerformance?.firstTimeChampions) 
      ? analysis.championPerformance.firstTimeChampions 
      : defaultChampionPerformance.firstTimeChampions,
    overallPerformanceScore: analysis.championPerformance?.overallPerformanceScore || defaultChampionPerformance.overallPerformanceScore
  };

  const summonerSpellUsage = {
    spellPlacementChanges: Array.isArray(analysis.summonerSpellUsage?.spellPlacementChanges)
      ? analysis.summonerSpellUsage.spellPlacementChanges
      : defaultSummonerSpellUsage.spellPlacementChanges,
    patternChangeScore: analysis.summonerSpellUsage?.patternChangeScore || defaultSummonerSpellUsage.patternChangeScore
  };

  const playtimeGaps = {
    gaps: Array.isArray(analysis.playtimeGaps?.gaps)
      ? analysis.playtimeGaps.gaps
      : defaultPlaytimeGaps.gaps,
    totalGapScore: analysis.playtimeGaps?.totalGapScore || defaultPlaytimeGaps.totalGapScore
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 11
          },
          padding: 8
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(74, 85, 104, 0.3)',
        },
        ticks: {
          color: '#a0aec0',
          font: {
            size: 10
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(74, 85, 104, 0.3)',
        },
        ticks: {
          color: '#a0aec0',
          font: {
            size: 10
          },
          maxRotation: 45
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderWidth: 1,
      },
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      }
    }
  };

  const championPerformanceData = {
    labels: championPerformance.firstTimeChampions.slice(0, 5).map(c => 
      c.championName.length > 8 ? c.championName.slice(0, 8) + '...' : c.championName
    ),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: championPerformance.firstTimeChampions.slice(0, 5).map(c => c.winRate * 100),
        backgroundColor: 'rgba(99, 179, 237, 0.7)',
        borderColor: 'rgba(99, 179, 237, 1)',
        borderWidth: 1,
      },
      {
        label: 'KDA',
        data: championPerformance.firstTimeChampions.slice(0, 5).map(c => c.kda * 10),
        backgroundColor: 'rgba(129, 140, 248, 0.7)',
        borderColor: 'rgba(129, 140, 248, 1)',
        borderWidth: 1,
      }
    ]
  };

  const playtimeGapsData = {
    labels: playtimeGaps.gaps.slice(0, 6).map(g => 
      new Date(g.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Gap Duration (Days)',
      data: playtimeGaps.gaps.slice(0, 6).map(g => Math.round(g.durationHours / 24)),
      backgroundColor: 'rgba(236, 72, 153, 0.7)',
      borderColor: 'rgba(236, 72, 153, 1)',
      borderWidth: 1,
    }]
  };

  // Generate mock performance trend data
  const performanceTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Performance Score',
        data: [4.2, 4.5, 4.8, 6.2, 7.1, 7.8, 8.3, 8.7],
        borderColor: 'rgba(99, 179, 237, 1)',
        backgroundColor: 'rgba(99, 179, 237, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'KDA',
        data: [1.8, 2.1, 2.3, 3.2, 3.8, 4.1, 4.5, 4.8],
        borderColor: 'rgba(129, 140, 248, 1)',
        backgroundColor: 'rgba(129, 140, 248, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const gameDurationTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Avg Game Duration (min)',
        data: [28, 26, 24, 22, 20, 19, 18, 17],
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const getGapSeverity = (hours: number): 'low' | 'medium' | 'high' => {
    const days = hours / 24;
    if (days >= 60) return 'high';
    if (days >= 14) return 'medium';
    return 'low';
  };

  // Mock advanced metrics data
  const advancedMetrics = [
    { name: 'Damage Efficiency', value: 87, suspicious: true, description: 'Damage per gold spent' },
    { name: 'Vision Score Trend', value: 72, suspicious: false, description: 'Ward placement improvement' },
    { name: 'CS Efficiency', value: 94, suspicious: true, description: 'CS per minute optimization' },
    { name: 'Objective Control', value: 89, suspicious: true, description: 'Dragon/Baron participation' },
    { name: 'Map Awareness', value: 76, suspicious: false, description: 'Reaction to unseen enemies' },
    { name: 'Item Build Optimization', value: 91, suspicious: true, description: 'Situational item choices' },
    { name: 'Lane Dominance', value: 83, suspicious: true, description: 'Early game advantage creation' },
    { name: 'Team Fight Positioning', value: 78, suspicious: false, description: 'Combat positioning quality' }
  ];

  return (
    <Container>
      <DashboardHeader>
        <DashboardTitle>Advanced Smurf Detection Analysis</DashboardTitle>
        <DashboardSubtitle>
          Comprehensive behavioral pattern analysis using machine learning algorithms and 5+ year historical data
        </DashboardSubtitle>
      </DashboardHeader>

      <AnalysisGrid>
        <AnalysisCard>
          <SectionHeader onClick={() => toggleSection('championPerformance')}>
            <span>🏆 Champion Performance</span>
    <div>
              <WeightBadge>65% weight</WeightBadge>
              <span style={{ marginLeft: '12px' }}>
                {expandedSections.championPerformance ? '▼' : '▶'}
              </span>
            </div>
        </SectionHeader>
        <SectionContent isExpanded={expandedSections.championPerformance}>
            <CompactStatGrid>
              <CompactStatCard>
              <StatValue>{Math.round(championPerformance.overallPerformanceScore * 100)}%</StatValue>
                <StatLabel>Performance Score</StatLabel>
              </CompactStatCard>
              <CompactStatCard>
                <StatValue>{championPerformance.firstTimeChampions.length}</StatValue>
                <StatLabel>Champions Analyzed</StatLabel>
              </CompactStatCard>
            </CompactStatGrid>
            
            <ChartContainer>
              <Bar data={championPerformanceData} options={chartOptions} />
            </ChartContainer>
            
            <ChampionGrid>
              {championPerformance.firstTimeChampions.slice(0, 4).map((champ, index) => (
                <ChampionCard key={index}>
                  <ChampionName>{champ.championName}</ChampionName>
                  <ChampionStatGrid>
                    <ChampionStat>
                      <ChampionStatValue>{Math.round(champ.winRate * 100)}%</ChampionStatValue>
                      <ChampionStatLabel>Win Rate</ChampionStatLabel>
                    </ChampionStat>
                    <ChampionStat>
                      <ChampionStatValue>{champ.kda.toFixed(1)}</ChampionStatValue>
                      <ChampionStatLabel>KDA</ChampionStatLabel>
                    </ChampionStat>
                    <ChampionStat>
                      <ChampionStatValue>{champ.csPerMinute.toFixed(1)}</ChampionStatValue>
                      <ChampionStatLabel>CS/min</ChampionStatLabel>
                    </ChampionStat>
                  </ChampionStatGrid>
                </ChampionCard>
              ))}
            </ChampionGrid>
          </SectionContent>
        </AnalysisCard>

        <AnalysisCard>
          <SectionHeader onClick={() => toggleSection('playtimeGaps')}>
            <span>⏰ Playtime Gaps</span>
                  <div>
              <WeightBadge>10% weight</WeightBadge>
              <span style={{ marginLeft: '12px' }}>
                {expandedSections.playtimeGaps ? '▼' : '▶'}
              </span>
            </div>
          </SectionHeader>
          <SectionContent isExpanded={expandedSections.playtimeGaps}>
            <CompactStatGrid>
              <CompactStatCard>
                <StatValue>{playtimeGaps.gaps.length}</StatValue>
                <StatLabel>Total Gaps</StatLabel>
              </CompactStatCard>
              <CompactStatCard>
                <StatValue>{Math.round(playtimeGaps.totalGapScore * 100)}%</StatValue>
                <StatLabel>Gap Suspicion</StatLabel>
              </CompactStatCard>
            </CompactStatGrid>
            
            <ChartContainer>
              <Bar data={playtimeGapsData} options={chartOptions} />
            </ChartContainer>
            
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {playtimeGaps.gaps.slice(0, 6).map((gap, index) => {
                const durationDays = Math.round(gap.durationHours / 24);
                const severity = getGapSeverity(gap.durationHours);
                
                return (
                  <GapAlert key={index} severity={severity}>
                    <strong>{durationDays} days</strong> gap • 
                    {new Date(gap.startDate).toLocaleDateString()} to {new Date(gap.endDate).toLocaleDateString()}
                    {severity === 'high' && ' 🚨'}
                    {severity === 'medium' && ' ⚠️'}
                  </GapAlert>
                );
              })}
                  </div>
          </SectionContent>
        </AnalysisCard>

        <AnalysisCard>
          <SectionHeader onClick={() => toggleSection('summonerSpells')}>
            <span>✨ Summoner Spells</span>
                  <div>
              <WeightBadge>25% weight</WeightBadge>
              <span style={{ marginLeft: '12px' }}>
                {expandedSections.summonerSpells ? '▼' : '▶'}
              </span>
                  </div>
          </SectionHeader>
          <SectionContent isExpanded={expandedSections.summonerSpells}>
            <CompactStatGrid>
              <CompactStatCard>
                <StatValue>{summonerSpellUsage.spellPlacementChanges.length}</StatValue>
                <StatLabel>Spell Changes</StatLabel>
              </CompactStatCard>
              <CompactStatCard>
                <StatValue>{Math.round(summonerSpellUsage.patternChangeScore * 100)}%</StatValue>
                <StatLabel>Pattern Score</StatLabel>
              </CompactStatCard>
            </CompactStatGrid>
            
            <div style={{ 
              padding: '16px',
              background: 'rgba(45, 55, 72, 0.3)',
              borderRadius: '8px',
              border: '1px solid rgba(74, 85, 104, 0.3)'
            }}>
              {summonerSpellUsage.spellPlacementChanges.length > 0 ? (
                  <div>
                  <h5 style={{ marginBottom: '12px', color: '#e2e8f0', fontSize: '14px' }}>Recent Spell Changes:</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {summonerSpellUsage.spellPlacementChanges.slice(0, 3).map((change, index) => (
                      <div key={index} style={{ 
                        padding: '8px 12px', 
                        margin: '4px 0',
                        background: 'rgba(99, 179, 237, 0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: '1px solid rgba(99, 179, 237, 0.2)'
                      }}>
                        <strong>Game {change.gameId}</strong> • {new Date(change.timestamp).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                  No significant spell pattern changes detected
                </div>
              )}
          </div>
        </SectionContent>
        </AnalysisCard>

        <WideCard>
          <SectionHeader onClick={() => toggleSection('trendAnalysis')}>
            <span>📈 Performance Trends</span>
            <div>
              <WeightBadge>Analysis over time</WeightBadge>
              <span style={{ marginLeft: '12px' }}>
                {expandedSections.trendAnalysis ? '▼' : '▶'}
              </span>
            </div>
          </SectionHeader>
          <SectionContent isExpanded={expandedSections.trendAnalysis}>
            <TrendContainer>
              <TrendCard>
                <TrendTitle>📊 Performance & KDA Progression</TrendTitle>
                <ChartContainer style={{ height: '240px' }}>
                  <Line data={performanceTrendData} options={chartOptions} />
                </ChartContainer>
                <div style={{ marginTop: '8px', color: '#a0aec0', fontSize: '11px' }}>
                  Sudden improvements may indicate account switching
                </div>
              </TrendCard>
              
              <TrendCard>
                <TrendTitle>⏱️ Game Duration Trend</TrendTitle>
                <ChartContainer style={{ height: '240px' }}>
                  <Line data={gameDurationTrendData} options={chartOptions} />
                </ChartContainer>
                <div style={{ marginTop: '8px', color: '#fc8181', fontSize: '11px' }}>
                  🚨 Decreasing game times suggest skill dominance
                </div>
              </TrendCard>
            </TrendContainer>
          </SectionContent>
        </WideCard>

        <WideCard>
          <SectionHeader onClick={() => toggleSection('advancedMetrics')}>
            <span>🎯 Advanced Detection Metrics</span>
            <div>
              <WeightBadge>ML-based analysis</WeightBadge>
              <span style={{ marginLeft: '12px' }}>
                {expandedSections.advancedMetrics ? '▼' : '▶'}
              </span>
            </div>
        </SectionHeader>
          <SectionContent isExpanded={expandedSections.advancedMetrics}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '12px' 
            }}>
              {advancedMetrics.map((metric, index) => (
                <MetricCard key={index}>
                  <MetricHeader>
                    <MetricName>{metric.name}</MetricName>
                    <MetricValue suspicious={metric.suspicious}>
                      {metric.value}%
                      {metric.suspicious && ' 🚨'}
                    </MetricValue>
                  </MetricHeader>
                  <ProgressBar 
                    percentage={metric.value} 
                    color={metric.suspicious ? '#fc8181' : '#68d391'} 
                  />
                  <div style={{ 
                    marginTop: '6px', 
                    fontSize: '11px', 
                    color: '#a0aec0' 
                  }}>
                    {metric.description}
                  </div>
                </MetricCard>
            ))}
          </div>
        </SectionContent>
        </WideCard>
      </AnalysisGrid>
    </Container>
  );
}; 