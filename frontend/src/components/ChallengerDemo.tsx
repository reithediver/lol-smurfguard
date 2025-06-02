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
    dataSource?: string;
  };
}

const ChallengerDemo: React.FC = () => {
  const [data, setData] = useState<ChallengerDemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallengerDemo();
  }, []);

  const fetchChallengerDemo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple endpoints in order of preference - Railway backend FIRST
      const endpoints = [
        'https://smurfgaurd-production.up.railway.app/api/mock/challenger-demo', // 🚂 Railway production backend
        'https://smurfgaurd-production.up.railway.app/api/demo/challenger-analysis', // 🚂 Railway demo endpoint
        '/mock-challenger-data.json', // Static JSON file fallback
        '/api/mock/challenger-demo', // Local mock endpoint if backend is available
        'http://localhost:3001/api/mock/challenger-demo' // Local development fallback
      ];
      
      let lastError: Error | null = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log(`Success with endpoint: ${endpoint}`, { dataSource: result.metadata?.dataSource || 'unknown' });
          setData(result);
          return; // Success, exit the function
          
        } catch (err) {
          console.log(`Failed endpoint ${endpoint}:`, err);
          lastError = err instanceof Error ? err : new Error('Unknown error');
          continue; // Try next endpoint
        }
      }
      
      // If we get here, all endpoints failed
      throw new Error(`All API endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
      
    } catch (err) {
      console.error('Demo fetch error:', err);
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

  if (renderError) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626' }}>
        <h3>Render Error</h3>
        <p>{renderError}</p>
        <button onClick={() => { setRenderError(null); fetchChallengerDemo(); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
          Reset & Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Add safety checks for data structure
  if (!data.data || !data.data.analysis || !Array.isArray(data.data.analysis)) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626' }}>
        <h3>Data Structure Error</h3>
        <p>Invalid data structure received from backend</p>
        <details style={{ marginTop: '0.5rem' }}>
          <summary>Debug Info</summary>
          <pre style={{ fontSize: '0.75rem', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '0.25rem', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
        <button onClick={fetchChallengerDemo} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  try {
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
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{data.data?.analysis?.length || 0}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Top Challengers Analyzed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{data.metadata?.responseTime || 'N/A'}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Response Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{data.data?.platformStatus?.region || 'Unknown'}</div>
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
                {data.systemInfo?.currentApiAccess ? Object.entries(data.systemInfo.currentApiAccess).map(([key, available]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ padding: '0.125rem 0.5rem', backgroundColor: available ? '#22c55e' : '#64748b', color: 'white', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      {available ? "✅" : "❌"}
                    </span>
                    <span style={{ fontSize: '0.875rem' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                )) : <div style={{ fontSize: '0.875rem', color: '#64748b' }}>No API access data available</div>}
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Demo Features</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {data.systemInfo?.demoFeatures ? data.systemInfo.demoFeatures.map((feature, index) => (
                  <li key={index} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{feature}</li>
                )) : <li style={{ fontSize: '0.875rem', color: '#64748b' }}>No demo features data available</li>}
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
            {data.systemInfo?.fullCapabilities ? Object.entries(data.systemInfo.fullCapabilities).map(([feature, description]) => (
              <div key={feature} style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
                <h5 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{feature}</h5>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{description}</p>
              </div>
            )) : (
              <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No enhanced features data available</p>
              </div>
            )}
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
  } catch (err) {
    console.error('Render error:', err);
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626' }}>
        <h3>Render Error</h3>
        <p>{err instanceof Error ? err.message : 'Unknown error occurred'}</p>
        <button onClick={() => { setRenderError(err instanceof Error ? err.message : 'Unknown error occurred'); fetchChallengerDemo(); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
          Reset & Retry
        </button>
      </div>
    );
  }
};

export default ChallengerDemo; 