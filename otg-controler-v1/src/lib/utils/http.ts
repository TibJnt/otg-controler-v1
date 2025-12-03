/**
 * Shared HTTP client utilities
 */

import { getConfig } from '../config';

export interface HttpResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Make a POST request to the iMouseXP API
 */
export async function imousePost<T = unknown>(
  fun: string,
  data: Record<string, unknown> = {}
): Promise<HttpResponse<T>> {
  const config = getConfig();
  const url = `${config.imouseBaseUrl}:${config.imousePort}/api`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fun, data }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const result = await response.json();

    // iMouseXP returns status 200 for success (or status 0 in some versions)
    if (result.status === 200 || result.status === 0) {
      return {
        success: true,
        data: result.data as T,
      };
    }

    return {
      success: false,
      error: result.message || result.msg || `iMouseXP error code: ${result.data?.code || 'unknown'}`,
      data: result.data as T,
    };
  } catch (error) {
    return {
      success: false,
      error: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Make a request to OpenAI API
 */
export async function openaiPost<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<HttpResponse<T>> {
  const config = getConfig();

  if (!config.openaiApiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }

  const url = `https://api.openai.com/v1${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
        status: response.status,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result as T,
    };
  } catch (error) {
    return {
      success: false,
      error: `OpenAI request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
