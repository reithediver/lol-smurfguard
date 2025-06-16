import React, { useState } from 'react';
import styled from 'styled-components';
import { OutlierGamesSection } from './OutlierGamesSection';

// Define the unified analysis data structure to match backend
interface SuspiciousIndicator {
    type: 'CHAMPION_MASTERY' | 'PERFORMANCE_OUTLIER' | 'GAP_ANALYSIS' | 'RANK_INCONSISTENCY' | 'BEHAVIORAL_PATTERN';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    confidence: number;
    evidence: string[];
    affectedChampions?: string[];
}

interface EnhancedChampionStats {
    championId: number;
    championName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgKDA: number;
    avgCS: number;
    avgCSPerMin: number;
    avgGold: number;
    avgGoldPerMin: number;
    avgDamageDealt: number;
    avgVisionScore: number;
    avgWardsPlaced: number;
    pentaKills: number;
    quadraKills: number;
    tripleKills: number;
    doubleKills: number;
    positions: { [position: string]: number };
    mostPlayedPosition: string;
    suspiciousIndicators: SuspiciousIndicator[];
    suspicionScore: number;
    benchmarkComparison: {
        csPerMinPercentile: number;
        kdaPercentile: number;
        winRatePercentile: number;
        damageSharePercentile: number;
        isOutlier: boolean;
    };
    opRating?: {
        overall: number;
        recent: number;
        trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
        breakdown: {
            laning: number;
            teamfighting: number;
            carrying: number;
            consistency: number;
        };
    };
    lanePerformance?: {
        vsOpponentRating: number;
        csAdvantage: number;
        killPressure: number;
        roamingImpact: number;
        laneWinRate: number;
    };
    algorithmicMetrics?: {
        consistencyScore: number;
        improvementRate: number;
        clutchFactor: number;
        adaptabilityScore: number;
        teamplayRating: number;
        mechanicalSkill: number;
        gameKnowledge: number;
        pressureHandling: number;
        learningCurve: number;
        metaAdaptation: number;
    };
}

interface UnifiedAnalysisData {
    summoner: {
        gameName: string;
        tagLine: string;
        summonerLevel: number;
        profileIconId: number;
        region: string;
    };
    overallStats: {
        totalGames: number;
        totalWins: number;
        overallWinRate: number;
        overallKDA: number;
        uniqueChampions: number;
        rankedSoloStats: {
            games: number;
            wins: number;
            winRate: number;
            avgKDA: number;
        };
        last10Games: Array<{
            championName: string;
            win: boolean;
            kda: number;
            gameDate: Date;
        }>;
    };
    championAnalysis: EnhancedChampionStats[];
    unifiedSuspicion: {
        overallScore: number;
        confidenceLevel: number;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        primaryIndicators: SuspiciousIndicator[];
        suspiciousGames: Array<{
            matchId: string;
            championName: string;
            performance: number;
            suspicionReasons: string[];
            date: Date;
        }>;
    };
    metadata: {
        analysisDate: Date;
        matchesAnalyzed: number;
        dataFreshness: 'FRESH' | 'RECENT' | 'STALE';
    };
    outlierAnalysis?: {
        outlierGames: Array<{
            matchId: string;
            championName: string;
            performance: number;
            suspicionReasons: string[];
            date: Date;
            matchUrl?: string;
        }>;
    };
}

// Styled Components
const Container = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
    min-height: 100vh;
    color: #e2e8f0;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PlayerInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
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

const PlayerDetails = styled.div``;

const PlayerName = styled.h1`
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 8px 0;
    color: #f7fafc;
`;

const PlayerLevel = styled.div`
    font-size: 16px;
    color: #a0aec0;
    margin-bottom: 8px;
`;

const SuspicionAlert = styled.div<{ riskLevel: string }>`
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    text-align: center;
    background: ${props => {
        switch (props.riskLevel) {
            case 'CRITICAL': return 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
            case 'HIGH': return 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
            case 'MEDIUM': return 'linear-gradient(135deg, #d97706 0%, #a16207 100%)';
            default: return 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
        }
    }};
    color: white;
    border: 2px solid ${props => {
        switch (props.riskLevel) {
            case 'CRITICAL': return '#ef4444';
            case 'HIGH': return '#f97316';
            case 'MEDIUM': return '#eab308';
            default: return '#22c55e';
        }
    }};
`;

const StatsOverview = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
`;

const StatCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
`;

const StatValue = styled.div`
    font-size: 24px;
    font-weight: bold;
    color: #60a5fa;
    margin-bottom: 5px;
`;

const StatLabel = styled.div`
    font-size: 14px;
    color: #a0aec0;
`;

const SectionTitle = styled.h2`
    font-size: 24px;
    font-weight: bold;
    margin: 30px 0 20px 0;
    color: #f7fafc;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const FilterControls = styled.div`
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active?: boolean }>`
    padding: 8px 16px;
    border: 1px solid ${props => props.active ? '#60a5fa' : 'rgba(255, 255, 255, 0.2)'};
    background: ${props => props.active ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.active ? '#60a5fa' : '#e2e8f0'};
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    
    &:hover {
        background: rgba(96, 165, 250, 0.1);
        border-color: #60a5fa;
    }
`;

const ChampionTable = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
`;

const TableHeader = styled.div`
    display: grid;
    grid-template-columns: 240px 80px 120px 100px 100px 100px 100px 100px 80px;
    gap: 10px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    font-weight: bold;
    font-size: 12px;
    color: #f7fafc;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableRow = styled.div<{ suspicionScore?: number }>`
    display: grid;
    grid-template-columns: 240px 80px 120px 100px 100px 100px 100px 100px 80px;
    gap: 10px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;
    font-size: 13px;
    
    background: ${props => {
        if (!props.suspicionScore) return 'transparent';
        if (props.suspicionScore >= 70) return 'rgba(220, 38, 38, 0.1)';
        if (props.suspicionScore >= 50) return 'rgba(251, 146, 60, 0.1)';
        if (props.suspicionScore >= 30) return 'rgba(250, 204, 21, 0.1)';
        return 'transparent';
    }};
    
    border-left: ${props => {
        if (!props.suspicionScore) return '3px solid transparent';
        if (props.suspicionScore >= 70) return '3px solid #dc2626';
        if (props.suspicionScore >= 50) return '3px solid #ea580c';
        if (props.suspicionScore >= 30) return '3px solid #eab308';
        return '3px solid transparent';
    }};
    
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
    font-size: 10px;
    font-weight: bold;
    color: white;
    flex-shrink: 0;
`;

const ChampionName = styled.div`
    font-weight: 600;
    color: #f7fafc;
    font-size: 14px;
`;

const WinRateBar = styled.div<{ winRate: number }>`
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
    margin-top: 2px;
    
    &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${props => props.winRate}%;
        background: ${props => props.winRate >= 60 ? '#22c55e' : props.winRate >= 50 ? '#eab308' : '#ef4444'};
        border-radius: 2px;
    }
`;

const SuspicionBadge = styled.div<{ score: number }>`
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    background: ${props => {
        if (props.score >= 70) return '#dc2626';
        if (props.score >= 50) return '#ea580c';
        if (props.score >= 30) return '#eab308';
        return '#6b7280';
    }};
    color: white;
`;

const IndicatorsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
`;

const IndicatorItem = styled.div<{ severity: string }>`
    padding: 12px;
    border-radius: 8px;
    border-left: 4px solid ${props => {
        switch (props.severity) {
            case 'CRITICAL': return '#dc2626';
            case 'HIGH': return '#ea580c';
            case 'MEDIUM': return '#eab308';
            default: return '#6b7280';
        }
    }};
    background: rgba(255, 255, 255, 0.05);
`;

const IndicatorTitle = styled.div`
    font-weight: bold;
    margin-bottom: 4px;
    color: #f7fafc;
`;

const IndicatorDescription = styled.div`
    font-size: 14px;
    color: #a0aec0;
    margin-bottom: 8px;
`;

const EvidenceList = styled.ul`
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
    padding-left: 16px;
`;

interface UnifiedSmurfAnalysisProps {
    data: UnifiedAnalysisData;
}

const UnifiedSmurfAnalysis: React.FC<UnifiedSmurfAnalysisProps> = ({ data }) => {
    const [filter, setFilter] = useState<'all' | 'suspicious' | 'high-risk'>('all');
    const [sortBy, setSortBy] = useState<'suspicion' | 'winrate' | 'games' | 'oprating'>('suspicion');

    // Filter and sort champions
    const filteredChampions = data.championAnalysis
        .filter(champ => {
            if (filter === 'suspicious') return champ.suspicionScore >= 30;
            if (filter === 'high-risk') return champ.suspicionScore >= 50;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'suspicion': return b.suspicionScore - a.suspicionScore;
                case 'winrate': return b.winRate - a.winRate;
                case 'games': return b.gamesPlayed - a.gamesPlayed;
                case 'oprating': return (b.opRating?.overall || 0) - (a.opRating?.overall || 0);
                default: return 0;
            }
        });

    return (
        <Container>
            {/* Header with Player Info and Suspicion Alert */}
            <Header>
                <PlayerInfo>
                    <ProfileIcon>
                        {data.summoner.gameName.slice(0, 2).toUpperCase()}
                    </ProfileIcon>
                    <PlayerDetails>
                        <PlayerName>{data.summoner.gameName}#{data.summoner.tagLine}</PlayerName>
                        <PlayerLevel>Level {data.summoner.summonerLevel} • {data.summoner.region.toUpperCase()}</PlayerLevel>
                        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {data.metadata.matchesAnalyzed} matches analyzed • {data.metadata.dataFreshness.toLowerCase()} data
                        </div>
                    </PlayerDetails>
                </PlayerInfo>
                
                <SuspicionAlert riskLevel={data.unifiedSuspicion.riskLevel}>
                    🎯 SMURF LIKELIHOOD: {data.unifiedSuspicion.overallScore}% ({data.unifiedSuspicion.riskLevel})
                    <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                        Confidence: {data.unifiedSuspicion.confidenceLevel}%
                    </div>
                </SuspicionAlert>
            </Header>

            {/* Stats Overview */}
            <StatsOverview>
                <StatCard>
                    <StatValue>{data.overallStats.totalGames}</StatValue>
                    <StatLabel>Total Games</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue>{(data.overallStats.overallWinRate * 100).toFixed(1)}%</StatValue>
                    <StatLabel>Overall Win Rate</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue>{data.overallStats.overallKDA.toFixed(2)}</StatValue>
                    <StatLabel>Average KDA</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue>{data.overallStats.uniqueChampions}</StatValue>
                    <StatLabel>Champions Played</StatLabel>
                </StatCard>
                <StatCard>
                    <StatValue>{data.overallStats.rankedSoloStats.games}</StatValue>
                    <StatLabel>Ranked Games</StatLabel>
                </StatCard>
            </StatsOverview>

            {/* Primary Suspicious Indicators */}
            {data.unifiedSuspicion.primaryIndicators.length > 0 && (
                <>
                    <SectionTitle>🚨 Primary Suspicious Indicators</SectionTitle>
                    <IndicatorsList>
                        {data.unifiedSuspicion.primaryIndicators.map((indicator, index) => (
                            <IndicatorItem key={index} severity={indicator.severity}>
                                <IndicatorTitle>
                                    {indicator.type.replace(/_/g, ' ')} - {indicator.severity} Risk
                                </IndicatorTitle>
                                <IndicatorDescription>{indicator.description}</IndicatorDescription>
                                <EvidenceList>
                                    {indicator.evidence.map((evidence, i) => (
                                        <li key={i}>{evidence}</li>
                                    ))}
                                </EvidenceList>
                            </IndicatorItem>
                        ))}
                    </IndicatorsList>
                </>
            )}

            {/* Champion Analysis Table */}
            <SectionTitle>📊 Champion Performance Analysis</SectionTitle>
            
            <FilterControls>
                <FilterButton 
                    active={filter === 'all'} 
                    onClick={() => setFilter('all')}
                >
                    All Champions ({data.championAnalysis.length})
                </FilterButton>
                <FilterButton 
                    active={filter === 'suspicious'} 
                    onClick={() => setFilter('suspicious')}
                >
                    Suspicious ({data.championAnalysis.filter(c => c.suspicionScore >= 30).length})
                </FilterButton>
                <FilterButton 
                    active={filter === 'high-risk'} 
                    onClick={() => setFilter('high-risk')}
                >
                    High Risk ({data.championAnalysis.filter(c => c.suspicionScore >= 50).length})
                </FilterButton>
                
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                    <FilterButton 
                        active={sortBy === 'suspicion'} 
                        onClick={() => setSortBy('suspicion')}
                    >
                        Sort by Suspicion
                    </FilterButton>
                    <FilterButton 
                        active={sortBy === 'winrate'} 
                        onClick={() => setSortBy('winrate')}
                    >
                        Sort by Win Rate
                    </FilterButton>
                    <FilterButton 
                        active={sortBy === 'games'} 
                        onClick={() => setSortBy('games')}
                    >
                        Sort by Games
                    </FilterButton>
                    <FilterButton 
                        active={sortBy === 'oprating'} 
                        onClick={() => setSortBy('oprating')}
                    >
                        Sort by OP Rating
                    </FilterButton>
                </div>
            </FilterControls>

            <div style={{ 
                overflowX: 'auto', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <table style={{ 
                    width: '100%', 
                    minWidth: '1800px', 
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                }}>
                    <thead>
                        <tr style={{ 
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <th style={{ padding: '16px 12px', textAlign: 'left', color: '#60a5fa', fontWeight: 'bold', minWidth: '120px' }}>Champion</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '80px' }}>Games</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '100px' }}>Win Rate</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '80px' }}>KDA</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '80px' }}>CS/min</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Gold/min</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Damage</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '80px' }}>Vision</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>OP Rating</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '100px' }}>VS Opponent</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Consistency</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Improvement</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Clutch</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Mechanical</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Teamplay</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Knowledge</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '90px' }}>Learning</th>
                            <th style={{ padding: '16px 12px', textAlign: 'center', color: '#60a5fa', fontWeight: 'bold', minWidth: '80px' }}>Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                
                        {filteredChampions.map((champion, index) => (
                            <tr key={`${champion.championId}-${index}`} style={{ 
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                background: champion.suspicionScore >= 50 ? 'rgba(239, 68, 68, 0.1)' : 
                                           champion.suspicionScore >= 30 ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                            }}>
                                {/* Champion Name */}
                                <td style={{ padding: '16px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '16px' }}>
                                            {champion.championName}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            {champion.mostPlayedPosition}
                                        </div>
                                    </div>
                                </td>
                                
                                {/* Games */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.gamesPlayed}
                                    </div>
                                </td>
                                
                                {/* Win Rate */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '20px', 
                                        fontWeight: 'bold',
                                        color: champion.winRate >= 0.6 ? '#22c55e' : champion.winRate >= 0.5 ? '#eab308' : '#ef4444'
                                    }}>
                                        {(champion.winRate * 100).toFixed(0)}%
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {champion.wins}W {champion.losses}L
                                    </div>
                                </td>
                                
                                {/* KDA */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.avgKDA.toFixed(1)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                        {champion.avgKills.toFixed(1)}/{champion.avgDeaths.toFixed(1)}/{champion.avgAssists.toFixed(1)}
                                    </div>
                                </td>
                                
                                {/* CS/min */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.avgCSPerMin.toFixed(1)}
                                    </div>
                                </td>
                                
                                {/* Gold/min */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.avgGoldPerMin.toFixed(0)}
                                    </div>
                                </td>
                                
                                {/* Damage */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {(champion.avgDamageDealt / 1000).toFixed(0)}k
                                    </div>
                                </td>
                                
                                {/* Vision */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.avgVisionScore.toFixed(0)}
                                    </div>
                                </td>
                                
                                {/* OP Rating */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    {champion.opRating ? (
                                        <div style={{ 
                                            fontSize: '20px', 
                                            fontWeight: 'bold',
                                            color: champion.opRating.overall >= 70 ? '#22c55e' : 
                                                   champion.opRating.overall >= 50 ? '#eab308' : '#ef4444'
                                        }}>
                                            {champion.opRating.overall}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#64748b', fontSize: '16px' }}>N/A</div>
                                    )}
                                </td>
                                
                                {/* VS Opponent */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    {champion.lanePerformance ? (
                                        <div style={{ 
                                            fontSize: '18px', 
                                            fontWeight: 'bold',
                                            color: champion.lanePerformance.vsOpponentRating >= 70 ? '#22c55e' : 
                                                   champion.lanePerformance.vsOpponentRating >= 50 ? '#eab308' : '#ef4444'
                                        }}>
                                            {champion.lanePerformance.vsOpponentRating}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#64748b', fontSize: '16px' }}>N/A</div>
                                    )}
                                </td>
                                
                                {/* Algorithmic Metrics */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.algorithmicMetrics?.consistencyScore || 'N/A'}
                                    </div>
                                </td>
                                
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.algorithmicMetrics?.improvementRate || 'N/A'}
                                    </div>
                                </td>
                                
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.algorithmicMetrics?.clutchFactor || 'N/A'}
                                    </div>
                                </td>
                                
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.algorithmicMetrics?.mechanicalSkill || 'N/A'}
                                    </div>
                                </td>
                                
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.algorithmicMetrics?.teamplayRating || 'N/A'}
                                    </div>
                                </td>
                                
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.algorithmicMetrics?.gameKnowledge || 'N/A'}
                                    </div>
                                </td>
                                
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                        {champion.algorithmicMetrics?.learningCurve || 'N/A'}
                                    </div>
                                </td>
                                
                                {/* Risk Score */}
                                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '20px', 
                                        fontWeight: 'bold',
                                        color: champion.suspicionScore >= 70 ? '#ef4444' : 
                                               champion.suspicionScore >= 50 ? '#f97316' : 
                                               champion.suspicionScore >= 30 ? '#eab308' : '#22c55e'
                                    }}>
                                        {champion.suspicionScore}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                                 </table>
             </div>

            {/* Outlier Games Section */}
            {data.outlierAnalysis && (
                <OutlierGamesSection 
                    games={data.outlierAnalysis.outlierGames}
                    onGameClick={(game) => {
                        if (game.matchUrl) {
                            window.open(game.matchUrl, '_blank');
                        }
                    }}
                />
            )}
        </Container>
    );
};

export default UnifiedSmurfAnalysis; 