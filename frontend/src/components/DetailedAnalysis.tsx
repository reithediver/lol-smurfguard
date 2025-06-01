import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
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

const AnalysisSection = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
  color: #fff;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  background: #333;
  border-radius: 4px;
  margin-bottom: 10px;

  &:hover {
    background: #444;
  }
`;

const SectionContent = styled.div<{ isExpanded: boolean }>`
  max-height: ${props => props.isExpanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 15px 0;
`;

const StatCard = styled.div`
  background: #333;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #888;
  margin-top: 5px;
`;

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ analysis }) => {
  const [expandedSections, setExpandedSections] = useState({
    championPerformance: true,
    summonerSpells: true,
    playtimeGaps: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const championPerformanceData = {
    labels: analysis.championPerformance.firstTimeChampions.map(c => c.championName),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: analysis.championPerformance.firstTimeChampions.map(c => c.winRate * 100),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'KDA',
        data: analysis.championPerformance.firstTimeChampions.map(c => c.kda),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      }
    ]
  };

  const playtimeGapsData = {
    labels: analysis.playtimeGaps.gaps.map(g => 
      new Date(g.startDate).toLocaleDateString()
    ),
    datasets: [{
      label: 'Gap Duration (Hours)',
      data: analysis.playtimeGaps.gaps.map(g => g.durationHours),
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
    }]
  };

  return (
    <div>
      <AnalysisSection>
        <SectionHeader onClick={() => toggleSection('championPerformance')}>
          <h3>Champion Performance (60% weight)</h3>
          <span>{expandedSections.championPerformance ? '▼' : '▶'}</span>
        </SectionHeader>
        <SectionContent isExpanded={expandedSections.championPerformance}>
          <StatGrid>
            <StatCard>
              <StatValue>{Math.round(analysis.championPerformance.overallPerformanceScore * 100)}%</StatValue>
              <StatLabel>Overall Performance Score</StatLabel>
            </StatCard>
          </StatGrid>
          <Bar data={championPerformanceData} />
          <div style={{ marginTop: '20px' }}>
            <h4>First-Time Champion Performance</h4>
            {analysis.championPerformance.firstTimeChampions.map((champ, index) => (
              <StatCard key={index}>
                <h5>{champ.championName}</h5>
                <StatGrid>
                  <div>
                    <StatValue>{Math.round(champ.winRate * 100)}%</StatValue>
                    <StatLabel>Win Rate</StatLabel>
                  </div>
                  <div>
                    <StatValue>{champ.kda.toFixed(2)}</StatValue>
                    <StatLabel>KDA</StatLabel>
                  </div>
                  <div>
                    <StatValue>{champ.csPerMinute.toFixed(1)}</StatValue>
                    <StatLabel>CS/min</StatLabel>
                  </div>
                </StatGrid>
              </StatCard>
            ))}
          </div>
        </SectionContent>
      </AnalysisSection>

      <AnalysisSection>
        <SectionHeader onClick={() => toggleSection('summonerSpells')}>
          <h3>Summoner Spell Usage (25% weight)</h3>
          <span>{expandedSections.summonerSpells ? '▼' : '▶'}</span>
        </SectionHeader>
        <SectionContent isExpanded={expandedSections.summonerSpells}>
          <StatGrid>
            <StatCard>
              <StatValue>{Math.round(analysis.summonerSpellUsage.patternChangeScore * 100)}%</StatValue>
              <StatLabel>Pattern Change Score</StatLabel>
            </StatCard>
          </StatGrid>
          <div style={{ marginTop: '20px' }}>
            <h4>Spell Placement Changes</h4>
            {analysis.summonerSpellUsage.spellPlacementChanges.map((change, index) => (
              <StatCard key={index}>
                <div>Game ID: {change.gameId}</div>
                <div>Time: {new Date(change.timestamp).toLocaleString()}</div>
                <div>Changed from: {change.oldSpells.join(', ')} to {change.newSpells.join(', ')}</div>
              </StatCard>
            ))}
          </div>
        </SectionContent>
      </AnalysisSection>

      <AnalysisSection>
        <SectionHeader onClick={() => toggleSection('playtimeGaps')}>
          <h3>Playtime Gaps (10% weight)</h3>
          <span>{expandedSections.playtimeGaps ? '▼' : '▶'}</span>
        </SectionHeader>
        <SectionContent isExpanded={expandedSections.playtimeGaps}>
          <StatGrid>
            <StatCard>
              <StatValue>{Math.round(analysis.playtimeGaps.totalGapScore * 100)}%</StatValue>
              <StatLabel>Total Gap Score</StatLabel>
            </StatCard>
          </StatGrid>
          <Bar data={playtimeGapsData} />
        </SectionContent>
      </AnalysisSection>
    </div>
  );
}; 