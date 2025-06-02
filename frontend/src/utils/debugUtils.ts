/**
 * Debugging utilities for JSON parsing and API response issues
 */

export interface ResponseDebugInfo {
  url: string;
  status: number;
  statusText: string;
  contentType: string | null;
  responseLength: number;
  responsePreview: string;
  isHtml: boolean;
  isEmpty: boolean;
  parseError?: string;
}

/**
 * Analyzes a fetch response and provides detailed debugging information
 */
export async function analyzeResponse(response: Response): Promise<ResponseDebugInfo> {
  const url = response.url;
  const status = response.status;
  const statusText = response.statusText;
  const contentType = response.headers.get('content-type');
  
  // Get response text
  const responseText = await response.text();
  const responseLength = responseText.length;
  const responsePreview = responseText.substring(0, 300);
  
  // Check if response is HTML
  const isHtml = responseText.trim().startsWith('<!DOCTYPE') || 
                 responseText.trim().startsWith('<html') || 
                 responseText.trim().startsWith('<!doctype') ||
                 responseText.includes('<html>') ||
                 responseText.includes('<!DOCTYPE html>') ||
                 (contentType !== null && contentType.includes('text/html'));
  
  // Check if response is empty
  const isEmpty = !responseText || responseText.trim().length === 0;
  
  // Try to parse as JSON to get parse error
  let parseError: string | undefined;
  if (!isHtml && !isEmpty) {
    try {
      JSON.parse(responseText);
    } catch (error) {
      parseError = error instanceof Error ? error.message : 'Unknown JSON parsing error';
    }
  }
  
  return {
    url,
    status,
    statusText,
    contentType,
    responseLength,
    responsePreview,
    isHtml,
    isEmpty,
    parseError
  };
}

/**
 * Enhanced fetch wrapper with detailed error reporting
 */
export async function debugFetch(url: string, options?: RequestInit): Promise<any> {
  console.log(`🔍 Debug fetch: ${url}`);
  
  try {
    const response = await fetch(url, options);
    const debugInfo = await analyzeResponse(response.clone());
    
    console.log(`📊 Response analysis for ${url}:`, debugInfo);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (debugInfo.isHtml) {
      throw new Error(`Endpoint returned HTML instead of JSON. Content-Type: ${debugInfo.contentType}. Preview: ${debugInfo.responsePreview.substring(0, 100)}...`);
    }
    
    if (debugInfo.isEmpty) {
      throw new Error(`Endpoint returned empty response`);
    }
    
    if (debugInfo.parseError) {
      throw new Error(`JSON parsing failed: ${debugInfo.parseError}. Preview: ${debugInfo.responsePreview.substring(0, 200)}...`);
    }
    
    // If we get here, try to parse the response
    const responseText = await response.text();
    return JSON.parse(responseText);
    
  } catch (error) {
    console.error(`❌ Debug fetch failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Test multiple endpoints and return the first successful one
 */
export async function testEndpoints(endpoints: string[]): Promise<{ endpoint: string; data: any; debugInfo: ResponseDebugInfo[] }> {
  const debugInfos: ResponseDebugInfo[] = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🧪 Testing endpoint: ${endpoint}`);
      const response = await fetch(endpoint);
      const debugInfo = await analyzeResponse(response.clone());
      debugInfos.push(debugInfo);
      
      if (response.ok && !debugInfo.isHtml && !debugInfo.isEmpty && !debugInfo.parseError) {
        const responseText = await response.text();
        const data = JSON.parse(responseText);
        console.log(`✅ Endpoint successful: ${endpoint}`);
        return { endpoint, data, debugInfo: debugInfos };
      }
    } catch (error) {
      console.log(`❌ Endpoint failed: ${endpoint}`, error);
    }
  }
  
  throw new Error(`All endpoints failed. Debug info: ${JSON.stringify(debugInfos, null, 2)}`);
}

/**
 * Log detailed error information for debugging
 */
export function logDetailedError(error: any, context: string) {
  console.group(`🚨 Detailed Error Report: ${context}`);
  console.error('Error object:', error);
  console.error('Error message:', error?.message);
  console.error('Error stack:', error?.stack);
  console.error('Error type:', typeof error);
  console.error('Error constructor:', error?.constructor?.name);
  console.groupEnd();
} 