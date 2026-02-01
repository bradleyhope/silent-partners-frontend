/**
 * iOS Safari-compatible SSE streaming implementation.
 * 
 * Safari on iOS has issues with ReadableStream from fetch responses.
 * This implementation adds:
 * 1. Better error handling and logging
 * 2. Chunk-based processing that works on iOS
 * 3. Fallback text() parsing if streaming fails
 */

// Detect iOS Safari
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS && isSafari;
}

/**
 * Process SSE text data and extract events.
 * Works with both streaming chunks and full text responses.
 */
export function parseSSEEvents(text: string): Array<{ type: string; [key: string]: any }> {
  const events: Array<{ type: string; [key: string]: any }> = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.slice(6).trim();
        if (jsonStr) {
          const event = JSON.parse(jsonStr);
          events.push(event);
        }
      } catch (e) {
        console.warn('Failed to parse SSE event:', line, e);
      }
    }
  }
  
  return events;
}

/**
 * iOS-compatible streaming fetch that falls back to text() if ReadableStream fails.
 */
export async function fetchWithIOSFallback(
  url: string,
  options: RequestInit,
  onEvent: (event: { type: string; [key: string]: any }) => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const isIOS = isIOSSafari();
  console.log(`[SSE] Starting fetch, iOS Safari: ${isIOS}`);
  
  try {
    const response = await fetch(url, { ...options, signal });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      onError(error.error || `HTTP ${response.status}`);
      return;
    }
    
    // Try streaming first
    if (response.body && !isIOS) {
      console.log('[SSE] Using ReadableStream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              console.log('[SSE] Event:', event.type);
              onEvent(event);
            } catch (e) {
              console.warn('[SSE] Parse error:', line, e);
            }
          }
        }
      }
      
      // Process any remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.slice(6));
          onEvent(event);
        } catch (e) {
          // Ignore incomplete final chunk
        }
      }
    } else {
      // iOS fallback: read entire response as text
      console.log('[SSE] Using text() fallback for iOS');
      const text = await response.text();
      console.log('[SSE] Received text length:', text.length);
      
      const events = parseSSEEvents(text);
      console.log('[SSE] Parsed events:', events.length);
      
      for (const event of events) {
        console.log('[SSE] Processing event:', event.type);
        onEvent(event);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[SSE] Request aborted');
      return;
    }
    console.error('[SSE] Fetch error:', error);
    onError(error instanceof Error ? error.message : 'Connection failed');
  }
}
