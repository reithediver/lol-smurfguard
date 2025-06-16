import React, { useState } from 'react';
import styled from 'styled-components';
import { OutlierGame, OutlierFlag } from '../types/OutlierGame';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #f1f5f9;
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const FilterButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: ${props => props.active ? '#f1f5f9' : '#94a3b8'};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
  }
`;

const GamesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GameCard = styled.div<{ outlierScore: number }>`
  background: ${props => 
    props.outlierScore >= 90 ? 'rgba(239, 68, 68, 0.1)' :
    props.outlierScore >= 80 ? 'rgba(245, 158, 11, 0.1)' :
    props.outlierScore >= 70 ? 'rgba(234, 179, 8, 0.1)' :
    'rgba(255, 255, 255, 0.05)'
  };
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ChampionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChampionIcon = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #f1f5f9;
`;

const ChampionName = styled.div`
  font-weight: bold;
  color: #f1f5f9;
  font-size: 1.1rem;
`;

const GameDate = styled.div`
  color: #94a3b8;
  font-size: 0.9rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
`;

const MetricItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 6px;
`;

const MetricLabel = styled.div`
  color: #94a3b8;
  font-size: 0.8rem;
  margin-bottom: 4px;
`;

const MetricValue = styled.div<{ color?: string }>`
  color: ${props => props.color || '#f1f5f9'};
  font-weight: bold;
  font-size: 1.1rem;
`;

const FlagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const FlagBadge = styled.div<{ severity: string }>`
  background: ${props => 
    props.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' :
    props.severity === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' :
    props.severity === 'MODERATE' ? 'rgba(234, 179, 8, 0.2)' :
    'rgba(148, 163, 184, 0.2)'
  };
  color: ${props => 
    props.severity === 'CRITICAL' ? '#ef4444' :
    props.severity === 'HIGH' ? '#f97316' :
    props.severity === 'MODERATE' ? '#eab308' :
    '#94a3b8'
  };
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MatchLink = styled.a`
  color: #60a5fa;
  text-decoration: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;

  &:hover {
    text-decoration: underline;
  }
`;

interface OutlierGamesSectionProps {
  games: OutlierGame[];
  onGameClick?: (game: OutlierGame) => void;
}

export const OutlierGamesSection: React.FC<OutlierGamesSectionProps> = ({ games, onGameClick }) => {
  const [filter, setFilter] = useState<'all' | 'mvp' | 'perfect' | 'carried'>('all');

  const filteredGames = games.filter(game => {
    switch (filter) {
      case 'mvp': return game.teamMVP;
      case 'perfect': return game.perfectGame;
      case 'carried': return game.gameCarried;
      default: return true;
    }
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getKDAString = (game: OutlierGame) => {
    return `${game.kills}/${game.deaths}/${game.assists}`;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🔥';
      case 'HIGH': return '⚠️';
      case 'MODERATE': return '📊';
      default: return 'ℹ️';
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          🎯 Outlier Games Analysis
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            ({filteredGames.length} games)
          </span>
        </Title>
        <FilterContainer>
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            All Games
          </FilterButton>
          <FilterButton 
            active={filter === 'mvp'} 
            onClick={() => setFilter('mvp')}
          >
            Team MVP
          </FilterButton>
          <FilterButton 
            active={filter === 'perfect'} 
            onClick={() => setFilter('perfect')}
          >
            Perfect Games
          </FilterButton>
          <FilterButton 
            active={filter === 'carried'} 
            onClick={() => setFilter('carried')}
          >
            Carried Games
          </FilterButton>
        </FilterContainer>
      </Header>

      <GamesList>
        {filteredGames.map((game, index) => (
          <GameCard key={index} outlierScore={game.outlierScore}>
            <GameHeader>
              <ChampionInfo>
                <ChampionIcon>
                  {game.championName.substring(0, 2).toUpperCase()}
                </ChampionIcon>
                <div>
                  <ChampionName>{game.championName}</ChampionName>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    {game.queueType} • {game.position}
                  </div>
                </div>
              </ChampionInfo>
              <GameDate>{formatDate(game.gameDate)}</GameDate>
            </GameHeader>

            <MetricsGrid>
              <MetricItem>
                <MetricLabel>KDA</MetricLabel>
                <MetricValue color={game.kda >= 3 ? '#68d391' : '#f1f5f9'}>
                  {getKDAString(game)} ({game.kda.toFixed(2)})
                </MetricValue>
              </MetricItem>
              <MetricItem>
                <MetricLabel>CS/min</MetricLabel>
                <MetricValue color={game.csPerMinute >= 7 ? '#68d391' : '#f1f5f9'}>
                  {game.csPerMinute.toFixed(1)}
                </MetricValue>
              </MetricItem>
              <MetricItem>
                <MetricLabel>Damage Share</MetricLabel>
                <MetricValue color={game.damageShare >= 30 ? '#68d391' : '#f1f5f9'}>
                  {game.damageShare.toFixed(1)}%
                </MetricValue>
              </MetricItem>
              <MetricItem>
                <MetricLabel>Vision Score</MetricLabel>
                <MetricValue color={game.visionScore >= 25 ? '#68d391' : '#f1f5f9'}>
                  {game.visionScore}
                </MetricValue>
              </MetricItem>
              <MetricItem>
                <MetricLabel>Kill Participation</MetricLabel>
                <MetricValue color={game.killParticipation >= 70 ? '#68d391' : '#f1f5f9'}>
                  {game.killParticipation.toFixed(1)}%
                </MetricValue>
              </MetricItem>
              <MetricItem>
                <MetricLabel>Outlier Score</MetricLabel>
                <MetricValue color={
                  game.outlierScore >= 90 ? '#ef4444' :
                  game.outlierScore >= 80 ? '#f97316' :
                  game.outlierScore >= 70 ? '#eab308' :
                  '#f1f5f9'
                }>
                  {game.outlierScore}
                </MetricValue>
              </MetricItem>
            </MetricsGrid>

            <FlagsList>
              {game.outlierFlags.map((flag, flagIndex) => (
                <FlagBadge key={flagIndex} severity={flag.severity}>
                  {getSeverityIcon(flag.severity)} {flag.description}
                </FlagBadge>
              ))}
            </FlagsList>

            {game.matchUrl && (
              <MatchLink 
                href={game.matchUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGameClick) {
                    onGameClick(game);
                  } else {
                    window.open(game.matchUrl, '_blank');
                  }
                }}
              >
                🔗 View Match Details
              </MatchLink>
            )}
          </GameCard>
        ))}
      </GamesList>
    </Container>
  );
}; 