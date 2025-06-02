import React, { useState } from 'react';
import { debugFetch, testEndpoints, logDetailedError } from '../utils/debugUtils';

const DebugTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testFakerAnalysis = async () => {
    setLoading(true);
    setTestResults('Starting Faker analysis test...\n');
    
    try {
      // Test the specific endpoints that might be causing issues with Faker
      const endpoints = [
        'https://smurfgaurd-production.up.railway.app/api/analyze/comprehensive/Faker',
        'https://smurfgaurd-production.up.railway.app/api/analyze/basic/Faker',
        'https://smurfgaurd-production.up.railway.app/api/mock/challenger-demo',
        '/mock-challenger-data.json'
      ];
      
      setTestResults(prev => prev + `Testing ${endpoints.length} endpoints for Faker...\n`);
      
      const result = await testEndpoints(endpoints);
      
      setTestResults(prev => prev + `✅ Success with endpoint: ${result.endpoint}\n`);
      setTestResults(prev => prev + `📊 Data received: ${JSON.stringify(result.data, null, 2).substring(0, 500)}...\n`);
      setTestResults(prev => prev + `🔍 Debug info: ${JSON.stringify(result.debugInfo, null, 2)}\n`);
      
    } catch (error) {
      logDetailedError(error, 'Faker Analysis Test');
      setTestResults(prev => prev + `❌ All endpoints failed: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testIndividualEndpoint = async (url: string) => {
    setLoading(true);
    setTestResults(prev => prev + `\nTesting individual endpoint: ${url}\n`);
    
    try {
      const data = await debugFetch(url);
      setTestResults(prev => prev + `✅ Success: ${JSON.stringify(data, null, 2).substring(0, 300)}...\n`);
    } catch (error) {
      logDetailedError(error, `Individual Endpoint Test: ${url}`);
      setTestResults(prev => prev + `❌ Failed: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults('');
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#60a5fa', marginBottom: '2rem' }}>🔧 Debug Test - Faker JSON Parsing Issue</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={testFakerAnalysis}
          disabled={loading}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem', 
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '1rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Testing...' : '🧪 Test Faker Analysis'}
        </button>
        
        <button 
          onClick={() => testIndividualEndpoint('https://smurfgaurd-production.up.railway.app/api/analyze/comprehensive/Faker')}
          disabled={loading}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem', 
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '1rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          Test Comprehensive
        </button>
        
        <button 
          onClick={() => testIndividualEndpoint('https://smurfgaurd-production.up.railway.app/api/analyze/basic/Faker')}
          disabled={loading}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem', 
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '1rem',
            opacity: loading ? 0.6 : 1
          }}
        >
          Test Basic
        </button>
        
        <button 
          onClick={clearResults}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#6b7280', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem', 
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#1e293b', 
        border: '1px solid #334155', 
        borderRadius: '0.5rem', 
        padding: '1.5rem',
        minHeight: '400px',
        maxHeight: '600px',
        overflow: 'auto'
      }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Test Results:</h3>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          color: '#cbd5e1',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          {testResults || 'No tests run yet. Click a test button to start.'}
        </pre>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155' }}>
        <h4 style={{ color: '#f1f5f9', marginBottom: '0.5rem' }}>About this test:</h4>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5' }}>
          This debug component helps diagnose JSON parsing errors when analyzing Faker. 
          It tests multiple endpoints and provides detailed response analysis including:
        </p>
        <ul style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          <li>Response status and headers</li>
          <li>Content-Type detection</li>
          <li>HTML vs JSON response identification</li>
          <li>Response preview and length</li>
          <li>JSON parsing error details</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugTest; 