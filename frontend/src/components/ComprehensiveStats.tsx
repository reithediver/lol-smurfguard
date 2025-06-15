import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
  min-height: 100vh;
  color: #e2e8f0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ProfileIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.h1`
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #f7fafc;
`;

const PlayerLevel = styled.div`
  font-size: 16px;
  color: #a0aec0;
  margin-bottom: 12px;
`;

const RankInfo = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const RankBadge = styled.div`
  padding: 6px 12px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: #1a202c;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
`;

const WinRate = styled.div`
  font-size: 16px;
  color: #68d391;
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
`;

const StatsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 16px 0;
  color: #f7fafc;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: #a0aec0;
  font-size: 14px;
`;

const StatValue = styled.span`
  color: #f7fafc;
  font-weight: 600;
  font-size: 14px;
`;

const ChampionTable = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 200px 80px 120px 100px 100px 100px 100px;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  font-weight: bold;
  font-size: 14px;
  color: #f7fafc;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 200px 80px 120px 100px 100px 100px 100px;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ChampionCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChampionIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
`;

const ChampionName = styled.span`
  font-weight: 600;
  color: #f7fafc;
`;

const WinRateBar = styled.div<{ winRate: number }>`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => props.winRate}%;
    background: ${props => props.winRate >= 60 ? '#68d391' : props.winRate >= 50 ? '#ffd700' : '#f56565'};
    border-radius: 3px;
  }
`;

const KDABadge = styled.span<{ kda: number }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  background: ${props => props.kda >= 3 ? '#68d391' : props.kda >= 2 ? '#ffd700' : props.kda >= 1 ? '#ed8936' : '#f56565'};
  color: ${props => props.kda >= 2 ? '#1a202c' : '#ffffff'};
`;

const RecentGames = styled.div`
  margin-top: 30px;
`;

const GamesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GameRow = styled.div<{ win: boolean }>`
  display: grid;
  grid-template-columns: 60px 120px 100px 80px 100px 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: ${props => props.win ? 'rgba(104, 211, 145, 0.1)' : 'rgba(245, 101, 101, 0.1)'};
  border-left: 4px solid ${props => props.win ? '#68d391' : '#f56565'};
  border-radius: 6px;
  align-items: center;
`;

const GameResult = styled.div<{ win: boolean }>`
  font-weight: bold;
  color: ${props => props.win ? '#68d391' : '#f56565'};
  font-size: 14px;
`;

interface ComprehensiveStatsProps {
  data: {
    summoner: {
      gameName: string;
      tagLine: string;
      summonerLevel: number;
      profileIconId: number;
      region: string;
    };
    leagueData: Array<{
      queueType: string;
      tier: string;
      rank: string;
      leaguePoints: number;
      wins: number;
      losses: number;
    }>;
    championMastery: Array<{
      championId: number;
      championLevel: number;
      championPoints: number;
    }>;
    comprehensiveStats: {
      totalGames: number;
      totalWins: number;
      overallWinRate: number;
      overallKDA: number;
      uniqueChampions: number;
      mostPlayedChampions: Array<{
        championId: number;
        championName: string;
        gamesPlayed: number;
        wins: number;
        winRate: number;
        avgKDA: number;
        avgCSPerMin: number;
        avgDamageDealt: number;
        avgVisionScore: number;
        mostPlayedPosition: string;
      }>;
      last10Games: Array<{
        championId: number;
        championName: string;
        win: boolean;
        kda: number;
        gameDate: string;
        position: string;
      }>;
      rankedSoloStats: {
        games: number;
        wins: number;
        winRate: number;
        avgKDA: number;
      };
    };
  };
}

const ComprehensiveStats: React.FC<ComprehensiveStatsProps> = ({ data }) => {
  const { summoner, leagueData, comprehensiveStats } = data;
  
  // Get ranked solo queue data
  const rankedSolo = leagueData.find(league => league.queueType === 'RANKED_SOLO_5x5');
  
  return (
    <Container>
      <Header>
        <ProfileIcon>
          {summoner.gameName.charAt(0).toUpperCase()}
        </ProfileIcon>
        <PlayerInfo>
          <PlayerName>{summoner.gameName}#{summoner.tagLine}</PlayerName>
          <PlayerLevel>Level {summoner.summonerLevel} • {summoner.region.toUpperCase()}</PlayerLevel>
          <RankInfo>
            {rankedSolo && (
              <>
                <RankBadge>
                  {rankedSolo.tier} {rankedSolo.rank} ({rankedSolo.leaguePoints} LP)
                </RankBadge>
                <WinRate>
                  {rankedSolo.wins}W {rankedSolo.losses}L ({Math.round((rankedSolo.wins / (rankedSolo.wins + rankedSolo.losses)) * 100)}%)
                </WinRate>
              </>
            )}
          </RankInfo>
        </PlayerInfo>
      </Header>

      <StatsGrid>
        <StatsCard>
          <CardTitle>📊 Overall Statistics</CardTitle>
          <StatRow>
            <StatLabel>Total Games</StatLabel>
            <StatValue>{comprehensiveStats.totalGames}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Win Rate</StatLabel>
            <StatValue>{Math.round(comprehensiveStats.overallWinRate * 100)}%</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average KDA</StatLabel>
            <StatValue>{comprehensiveStats.overallKDA.toFixed(2)}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Unique Champions</StatLabel>
            <StatValue>{comprehensiveStats.uniqueChampions}</StatValue>
          </StatRow>
        </StatsCard>

        <StatsCard>
          <CardTitle>🏆 Ranked Solo/Duo</CardTitle>
          <StatRow>
            <StatLabel>Games Played</StatLabel>
            <StatValue>{comprehensiveStats.rankedSoloStats.games}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Win Rate</StatLabel>
            <StatValue>{Math.round(comprehensiveStats.rankedSoloStats.winRate * 100)}%</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average KDA</StatLabel>
            <StatValue>{comprehensiveStats.rankedSoloStats.avgKDA.toFixed(2)}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Current Rank</StatLabel>
            <StatValue>
              {rankedSolo ? `${rankedSolo.tier} ${rankedSolo.rank}` : 'Unranked'}
            </StatValue>
          </StatRow>
        </StatsCard>
      </StatsGrid>

      <ChampionTable>
        <CardTitle style={{ padding: '20px 20px 0 20px' }}>🏆 Champion Statistics</CardTitle>
        <TableHeader>
          <div>Champion</div>
          <div>Played</div>
          <div>Win Rate</div>
          <div>KDA</div>
          <div>CS/min</div>
          <div>Damage</div>
          <div>Vision</div>
        </TableHeader>
        {comprehensiveStats.mostPlayedChampions.slice(0, 10).map((champion, index) => (
          <TableRow key={champion.championId}>
            <ChampionCell>
              <ChampionIcon>
                {champion.championName.substring(0, 2).toUpperCase()}
              </ChampionIcon>
              <div>
                <ChampionName>{champion.championName}</ChampionName>
                <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                  {champion.mostPlayedPosition}
                </div>
              </div>
            </ChampionCell>
            <div style={{ color: '#f7fafc', fontWeight: '600' }}>
              {champion.gamesPlayed}
            </div>
            <div>
              <div style={{ color: '#f7fafc', fontWeight: '600', marginBottom: '4px' }}>
                {Math.round(champion.winRate * 100)}%
              </div>
              <WinRateBar winRate={champion.winRate * 100} />
            </div>
            <KDABadge kda={champion.avgKDA}>
              {champion.avgKDA.toFixed(1)}
            </KDABadge>
            <div style={{ color: '#f7fafc', fontWeight: '600' }}>
              {champion.avgCSPerMin.toFixed(1)}
            </div>
            <div style={{ color: '#f7fafc', fontWeight: '600' }}>
              {Math.round(champion.avgDamageDealt / 1000)}k
            </div>
            <div style={{ color: '#f7fafc', fontWeight: '600' }}>
              {Math.round(champion.avgVisionScore)}
            </div>
          </TableRow>
        ))}
      </ChampionTable>

      <RecentGames>
        <CardTitle>🎮 Recent Games</CardTitle>
        <GamesList>
          {comprehensiveStats.last10Games.map((game, index) => (
            <GameRow key={index} win={game.win}>
              <GameResult win={game.win}>
                {game.win ? 'WIN' : 'LOSS'}
              </GameResult>
              <ChampionCell>
                <ChampionIcon>
                  {game.championName.substring(0, 2).toUpperCase()}
                </ChampionIcon>
                <ChampionName>{game.championName}</ChampionName>
              </ChampionCell>
              <KDABadge kda={game.kda}>
                {game.kda.toFixed(1)} KDA
              </KDABadge>
              <div style={{ color: '#a0aec0', fontSize: '12px' }}>
                {game.position}
              </div>
              <div style={{ color: '#a0aec0', fontSize: '12px' }}>
                {new Date(game.gameDate).toLocaleDateString()}
              </div>
              <div></div>
            </GameRow>
          ))}
        </GamesList>
      </RecentGames>
    </Container>
  );
};

export default ComprehensiveStats; 