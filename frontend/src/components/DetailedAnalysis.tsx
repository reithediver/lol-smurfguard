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
  };
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
`;

const AnalysisCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  }
`;

const SectionContent = styled.div<{ isExpanded: boolean }>`
  max-height: ${props => props.isExpanded ? '800px' : '0'};
  opacity: ${props => props.isExpanded ? '1' : '0'};
  overflow: hidden;
  transition: all 0.4s ease-in-out;
  padding: ${props => props.isExpanded ? '16px 0' : '0'};
`;

const CompactStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin: 16px 0;
`;

const CompactStatCard = styled.div`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
  }
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
`;

const ChampionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const ChampionCard = styled.div`
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(168, 237, 234, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(168, 237, 234, 0.4);
  }
`;

const ChampionName = styled.h5`
  color: #2d3748;
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 16px;
`;

const ChampionStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const ChampionStat = styled.div`
  background: rgba(255, 255, 255, 0.8);
  padding: 8px;
  border-radius: 8px;
  color: #2d3748;
`;

const ChampionStatValue = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #4a5568;
`;

const ChampionStatLabel = styled.div`
  font-size: 10px;
  color: #718096;
  margin-top: 2px;
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0;
  height: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const GapAlert = styled.div<{ severity: 'low' | 'medium' | 'high' }>`
  background: ${props => {
    switch(props.severity) {
      case 'high': return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
      case 'medium': return 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)';
      default: return 'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)';
    }
  }};
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  margin: 8px 0;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const SectionTitle = styled.h2`
  color: white;
  text-align: center;
  margin-bottom: 32px;
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const WeightBadge = styled.span`
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
`;

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ analysis }) => {
  const [expandedSections, setExpandedSections] = useState({
    championPerformance: true,
    summonerSpells: false,
    playtimeGaps: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12
          },
          padding: 10
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderWidth: 1,
      }
    }
  };

  const championPerformanceData = {
    labels: analysis.championPerformance.firstTimeChampions.slice(0, 5).map(c => 
      c.championName.length > 8 ? c.championName.slice(0, 8) + '...' : c.championName
    ),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: analysis.championPerformance.firstTimeChampions.slice(0, 5).map(c => c.winRate * 100),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
      },
      {
        label: 'KDA',
        data: analysis.championPerformance.firstTimeChampions.slice(0, 5).map(c => c.kda * 10), // Scale for visibility
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      }
    ]
  };

  const playtimeGapsData = {
    labels: analysis.playtimeGaps.gaps.slice(0, 6).map(g => 
      new Date(g.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Gap Duration (Days)',
      data: analysis.playtimeGaps.gaps.slice(0, 6).map(g => Math.round(g.durationHours / 24)),
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }]
  };

  const getSuspicionColor = (level: number) => {
    if (level >= 0.8) return '#ff4757';
    if (level >= 0.6) return '#ffa502';
    if (level >= 0.4) return '#ffb142';
    return '#2ed573';
  };

  const getGapSeverity = (hours: number): 'low' | 'medium' | 'high' => {
    const days = hours / 24;
    if (days >= 60) return 'high';
    if (days >= 14) return 'medium';
    return 'low';
  };

  return (
    <Container>
      <SectionTitle>🔍 Advanced Smurf Analysis Dashboard</SectionTitle>
      
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
                <StatValue>{Math.round(analysis.championPerformance.overallPerformanceScore * 100)}%</StatValue>
                <StatLabel>Performance Score</StatLabel>
              </CompactStatCard>
              <CompactStatCard>
                <StatValue>{analysis.championPerformance.firstTimeChampions.length}</StatValue>
                <StatLabel>Champions Analyzed</StatLabel>
              </CompactStatCard>
            </CompactStatGrid>
            
            <ChartContainer>
              <Bar data={championPerformanceData} options={chartOptions} />
            </ChartContainer>
            
            <ChampionGrid>
              {analysis.championPerformance.firstTimeChampions.slice(0, 4).map((champ, index) => (
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
                <StatValue>{analysis.playtimeGaps.gaps.length}</StatValue>
                <StatLabel>Total Gaps</StatLabel>
              </CompactStatCard>
              <CompactStatCard>
                <StatValue>{Math.round(analysis.playtimeGaps.totalGapScore * 100)}%</StatValue>
                <StatLabel>Gap Suspicion</StatLabel>
              </CompactStatCard>
            </CompactStatGrid>
            
            <ChartContainer>
              <Bar data={playtimeGapsData} options={chartOptions} />
            </ChartContainer>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {analysis.playtimeGaps.gaps.slice(0, 6).map((gap, index) => {
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
                <StatValue>{analysis.summonerSpellUsage.spellPlacementChanges.length}</StatValue>
                <StatLabel>Spell Changes</StatLabel>
              </CompactStatCard>
              <CompactStatCard>
                <StatValue>{Math.round(analysis.summonerSpellUsage.patternChangeScore * 100)}%</StatValue>
                <StatLabel>Pattern Score</StatLabel>
              </CompactStatCard>
            </CompactStatGrid>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              padding: '16px', 
              borderRadius: '12px',
              color: '#2d3748'
            }}>
              {analysis.summonerSpellUsage.spellPlacementChanges.length > 0 ? (
                <div>
                  <h5 style={{ marginBottom: '12px', color: '#4a5568' }}>Recent Spell Changes:</h5>
                  {analysis.summonerSpellUsage.spellPlacementChanges.slice(0, 3).map((change, index) => (
                    <div key={index} style={{ 
                      padding: '8px 12px', 
                      margin: '4px 0',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      <strong>Game {change.gameId}</strong> • {new Date(change.timestamp).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#718096' }}>
                  No significant spell pattern changes detected
                </div>
              )}
            </div>
          </SectionContent>
        </AnalysisCard>
      </AnalysisGrid>
    </Container>
  );
}; 