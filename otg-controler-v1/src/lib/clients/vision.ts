/**
 * OpenAI Vision API client for analyzing screenshots
 */

import { getConfig } from '../config';
import { openaiPost } from '../utils/http';
import { VisionAnalysisResult } from '../types';

// OpenAI Chat Completion response structure
interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Internal parsed response from vision analysis
interface VisionJsonResponse {
  caption: string;
  topics: string[];
  contentType?: string;
  hasText?: boolean;
  textContent?: string;
}

const VISION_PROMPT = `Analyze this screenshot from a short-form video app (like TikTok).

Describe what you see in the video content and identify key topics/themes.

Respond ONLY with valid JSON in this exact format:
{
  "caption": "A brief 1-2 sentence description of the video content",
  "topics": ["topic1", "topic2", "topic3"],
  "contentType": "dance|comedy|tutorial|music|food|fitness|fashion|gaming|pets|nature|other",
  "hasText": true/false,
  "textContent": "any visible text in the video (empty string if none)"
}

Focus on identifying:
- What activity or content is shown (dancing, cooking, talking, etc.)
- People characteristics if relevant (but keep it general)
- The mood or style of the content
- Any visible hashtags or text overlays

Keep topics as single lowercase words when possible (e.g., "dance", "girl", "music", "funny", "cooking").`;

/**
 * Analyze an image using OpenAI Vision
 * @param imageData - Either a base64 string or a data URL
 */
export async function analyzeImage(
  imageData: string
): Promise<{ success: boolean; result?: VisionAnalysisResult; error?: string }> {
  const config = getConfig();

  // Ensure we have a proper data URL
  let imageUrl: string;
  if (imageData.startsWith('data:')) {
    imageUrl = imageData;
  } else {
    // Assume it's base64, add the data URL prefix
    imageUrl = `data:image/jpeg;base64,${imageData}`;
  }

  const response = await openaiPost<ChatCompletionResponse>('/chat/completions', {
    model: config.openaiModel,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: VISION_PROMPT,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'low', // Use low detail for faster/cheaper analysis
            },
          },
        ],
      },
    ],
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!response.success) {
    return { success: false, error: response.error };
  }

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    return { success: false, error: 'No response content from OpenAI' };
  }

  try {
    const parsed: VisionJsonResponse = JSON.parse(content);

    return {
      success: true,
      result: {
        caption: parsed.caption || '',
        topics: parsed.topics || [],
      },
    };
  } catch {
    return {
      success: false,
      error: `Failed to parse vision response: ${content}`,
    };
  }
}

/**
 * Analyze an image from a URL (for testing or external images)
 */
export async function analyzeImageUrl(
  url: string
): Promise<{ success: boolean; result?: VisionAnalysisResult; error?: string }> {
  const config = getConfig();

  const response = await openaiPost<ChatCompletionResponse>('/chat/completions', {
    model: config.openaiModel,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: VISION_PROMPT,
          },
          {
            type: 'image_url',
            image_url: {
              url,
              detail: 'low',
            },
          },
        ],
      },
    ],
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  if (!response.success) {
    return { success: false, error: response.error };
  }

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    return { success: false, error: 'No response content from OpenAI' };
  }

  try {
    const parsed: VisionJsonResponse = JSON.parse(content);

    return {
      success: true,
      result: {
        caption: parsed.caption || '',
        topics: parsed.topics || [],
      },
    };
  } catch {
    return {
      success: false,
      error: `Failed to parse vision response: ${content}`,
    };
  }
}

/**
 * Build analysis text from vision result for trigger matching
 */
export function buildAnalysisText(result: VisionAnalysisResult): string {
  const parts = [result.caption, ...result.topics];
  return parts.join(' ').toLowerCase();
}
