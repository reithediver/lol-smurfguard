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
          
          // Check if response is HTML instead of JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error(`Endpoint returned HTML instead of JSON. Content-Type: ${contentType}`);
          }
          
          // Get response text first to check for HTML
          const responseText = await response.text();
          
          // Enhanced HTML detection
          if (responseText.trim().startsWith('<!DOCTYPE') || 
              responseText.trim().startsWith('<html') || 
              responseText.trim().startsWith('<!doctype') ||
              responseText.includes('<html>') ||
              responseText.includes('<!DOCTYPE html>')) {
            throw new Error(`Endpoint returned HTML page instead of JSON. Response starts with: ${responseText.substring(0, 100)}...`);
          }
          
          // Additional safety check for empty or invalid responses
          if (!responseText || responseText.trim().length === 0) {
            throw new Error(`Endpoint returned empty response`);
          }
          
          // Try to parse as JSON with enhanced error handling
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            // Enhanced JSON parsing error with more context
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown JSON parsing error';
            const preview = responseText.substring(0, 200);
            console.error(`JSON parsing failed for endpoint ${endpoint}:`, {
              error: errorMessage,
              responsePreview: preview,
              responseLength: responseText.length,
              contentType: contentType
            });
            throw new Error(`JSON parsing failed (${errorMessage}). Response preview: ${preview}...`);
          }
          
          // Validate the parsed result has expected structure
          if (!result || typeof result !== 'object') {
            throw new Error(`Invalid response structure - expected object, got ${typeof result}`);
          }
          
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
      <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9' }}>
        <div>Loading challenger smurf analysis demo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '0.5rem', color: '#fecaca', minHeight: '100vh' }}>
        <h3 style={{ color: '#fecaca' }}>Error loading demo</h3>
        <p>{error}</p>
        <button onClick={fetchChallengerDemo} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (renderError) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '0.5rem', color: '#fecaca', minHeight: '100vh' }}>
        <h3 style={{ color: '#fecaca' }}>Render Error</h3>
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
      <div style={{ padding: '1rem', backgroundColor: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '0.5rem', color: '#fecaca', minHeight: '100vh' }}>
        <h3 style={{ color: '#fecaca' }}>Data Structure Error</h3>
        <p>Invalid data structure received from backend</p>
        <details style={{ marginTop: '0.5rem' }}>
          <summary>Debug Info</summary>
          <pre style={{ fontSize: '0.75rem', backgroundColor: '#374151', padding: '0.5rem', borderRadius: '0.25rem', overflow: 'auto', color: '#e2e8f0' }}>
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
      <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f1f5f9' }}>
            🏆 Challenger Smurf Analysis Demo
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>{data.message}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>{data.data?.analysis?.length || 0}</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Top Challengers Analyzed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34d399' }}>{data.metadata?.responseTime || 'N/A'}</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Response Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a78bfa' }}>{data.data?.platformStatus?.region || 'Unknown'}</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Region</div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f1f5f9' }}>System Capabilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#f1f5f9' }}>Current API Access</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {data.systemInfo?.currentApiAccess ? Object.entries(data.systemInfo.currentApiAccess).map(([key, available]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ padding: '0.125rem 0.5rem', backgroundColor: available ? '#22c55e' : '#64748b', color: 'white', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      {available ? "✅" : "❌"}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                )) : <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>No API access data available</div>}
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#f1f5f9' }}>Demo Features</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {data.systemInfo?.demoFeatures ? data.systemInfo.demoFeatures.map((feature, index) => (
                  <li key={index} style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>{feature}</li>
                )) : <li style={{ fontSize: '0.875rem', color: '#94a3b8' }}>No demo features data available</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Challenger Analysis Results - Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {data.data.analysis.map((player) => (
            <div key={player.rank} style={{ 
              padding: '1rem', 
              backgroundColor: '#1e293b', 
              borderRadius: '0.5rem', 
              border: '1px solid #475569', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', 
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0, color: '#f1f5f9' }}>Rank #{player.rank}</h3>
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
              <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {player.leaguePoints} LP • {player.winRate}% Win Rate
              </p>

              {/* Smurf Probability */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#e2e8f0' }}>Smurf Probability</span>
                  <span style={{ fontWeight: 'bold', color: '#f1f5f9' }}>{player.smurfAnalysis.probability.toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#374151', borderRadius: '9999px', height: '0.5rem' }}>
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
                <h5 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#f1f5f9' }}>Detection Factors</h5>
                {Object.entries(player.smurfAnalysis.factors).map(([key, factor]) => (
                  <div key={key} style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#e2e8f0' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={{ fontWeight: 'bold', color: '#f1f5f9' }}>{factor.weight}% weight</span>
                    </div>
                    <div style={{ color: '#94a3b8' }}>{factor.details}</div>
                  </div>
                ))}
              </div>

              {/* Real Data */}
              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #475569' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ color: '#cbd5e1' }}>Wins: {player.realData.seasonWins}</div>
                  <div style={{ color: '#cbd5e1' }}>Losses: {player.realData.seasonLosses}</div>
                  {player.realData.hotStreak && (
                    <div style={{ gridColumn: 'span 2', color: '#fb923c', fontWeight: 'bold' }}>🔥 Hot Streak</div>
                  )}
                  {player.realData.veteran && (
                    <div style={{ gridColumn: 'span 2', color: '#60a5fa' }}>⚡ Veteran Player</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Features Preview */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f1f5f9' }}>Enhanced Features (Available with Full API Access)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {data.systemInfo?.fullCapabilities ? Object.entries(data.systemInfo.fullCapabilities).map(([feature, description]) => (
              <div key={feature} style={{ padding: '0.75rem', backgroundColor: '#374151', borderRadius: '0.5rem', border: '1px solid #4b5563' }}>
                <h5 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#f1f5f9' }}>{feature}</h5>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>{description}</p>
              </div>
            )) : (
              <div style={{ padding: '0.75rem', backgroundColor: '#374151', borderRadius: '0.5rem', border: '1px solid #4b5563' }}>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>No enhanced features data available</p>
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
              gap: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
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
      <div style={{ padding: '1rem', backgroundColor: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '0.5rem', color: '#fecaca', minHeight: '100vh' }}>
        <h3 style={{ color: '#fecaca' }}>Render Error</h3>
        <p>{err instanceof Error ? err.message : 'Unknown error occurred'}</p>
        <button onClick={() => { setRenderError(err instanceof Error ? err.message : 'Unknown error occurred'); fetchChallengerDemo(); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
          Reset & Retry
        </button>
      </div>
    );
  }
};

export default ChallengerDemo; 