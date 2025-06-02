import React, { useState, useEffect } from 'react';

interface ChallengerPlayer {
  rank: number;
  winRate: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  smurfAnalysis: {
    probability: number;
    riskLevel: string;
    factors: {
      championPerformance: { weight: number; score: number; details: string };
      summonerSpells: { weight: number; score: number; details: string };
      playtimeGaps: { weight: number; score: number; details: string };
    };
    enhancedFeatures: Record<string, string>;
  };
  realData: {
    currentLP: number;
    seasonWins: number;
    seasonLosses: number;
    veteran: boolean;
    hotStreak: boolean;
    freshBlood: boolean;
  };
}

interface ChallengerDemoData {
  success: boolean;
  demoMode: boolean;
  message: string;
  data: {
    analysis: ChallengerPlayer[];
    platformStatus: {
      region: string;
      incidents: number;
      maintenances: number;
    };
    championRotation: {
      freeChampions: number;
      newPlayerChampions: number;
    };
  };
  systemInfo: {
    currentApiAccess: Record<string, boolean>;
    fullCapabilities: Record<string, string>;
    demoFeatures: string[];
  };
  metadata: {
    responseTime: string;
    timestamp: string;
    totalChallengers: number;
    apiKeyStatus: string;
  };
}

const ChallengerDemo: React.FC = () => {
  const [data, setData] = useState<ChallengerDemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallengerDemo();
  }, []);

  const fetchChallengerDemo = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/demo/challenger-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch challenger demo data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High': return '#ef4444';
      case 'High': return '#f97316';
      case 'Moderate': return '#eab308';
      case 'Low': return '#22c55e';
      case 'Very Low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High':
      case 'High':
        return '⚠️';
      case 'Moderate':
        return '📈';
      default:
        return '✅';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading challenger smurf analysis demo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626' }}>
        <h3>Error loading demo</h3>
        <p>{error}</p>
        <button onClick={fetchChallengerDemo} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 Challenger Smurf Analysis Demo
        </h1>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>{data.message}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{data.data.analysis.length}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Top Challengers Analyzed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{data.metadata.responseTime}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Response Time</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{data.data.platformStatus.region}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Region</div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>System Capabilities</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Current API Access</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {Object.entries(data.systemInfo.currentApiAccess).map(([key, available]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.125rem 0.5rem', backgroundColor: available ? '#22c55e' : '#64748b', color: 'white', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                    {available ? "✅" : "❌"}
                  </span>
                  <span style={{ fontSize: '0.875rem' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Demo Features</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.systemInfo.demoFeatures.map((feature, index) => (
                <li key={index} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Challenger Analysis Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {data.data.analysis.map((player) => (
          <div key={player.rank} style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', transition: 'box-shadow 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>Rank #{player.rank}</h3>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                backgroundColor: getRiskColor(player.smurfAnalysis.riskLevel), 
                color: 'white', 
                borderRadius: '0.375rem', 
                fontSize: '0.75rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {getRiskIcon(player.smurfAnalysis.riskLevel)}
                {player.smurfAnalysis.riskLevel}
              </span>
            </div>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {player.leaguePoints} LP • {player.winRate}% Win Rate
            </p>

            {/* Smurf Probability */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span>Smurf Probability</span>
                <span style={{ fontWeight: 'bold' }}>{player.smurfAnalysis.probability.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.5rem' }}>
                <div 
                  style={{ 
                    height: '0.5rem', 
                    borderRadius: '9999px',
                    backgroundColor: getRiskColor(player.smurfAnalysis.riskLevel),
                    width: `${player.smurfAnalysis.probability}%`,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
            </div>

            {/* Analysis Factors */}
            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Detection Factors</h5>
              {Object.entries(player.smurfAnalysis.factors).map(([key, factor]) => (
                <div key={key} style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ fontWeight: 'bold' }}>{factor.weight}% weight</span>
                  </div>
                  <div style={{ color: '#64748b' }}>{factor.details}</div>
                </div>
              ))}
            </div>

            {/* Real Data */}
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div>Wins: {player.realData.seasonWins}</div>
                <div>Losses: {player.realData.seasonLosses}</div>
                {player.realData.hotStreak && (
                  <div style={{ gridColumn: 'span 2', color: '#f97316', fontWeight: 'bold' }}>🔥 Hot Streak</div>
                )}
                {player.realData.veteran && (
                  <div style={{ gridColumn: 'span 2', color: '#3b82f6' }}>⚡ Veteran Player</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Features Preview */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Enhanced Features (Available with Full API Access)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {Object.entries(data.systemInfo.fullCapabilities).map(([feature, description]) => (
            <div key={feature} style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
              <h5 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{feature}</h5>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={fetchChallengerDemo}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.375rem', 
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📈 Refresh Analysis
        </button>
      </div>
    </div>
  );
};

export default ChallengerDemo; 