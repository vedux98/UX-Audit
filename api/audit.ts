import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Set CORS headers for all responses to handle preflight requests
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { url } = request.query;
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!url) {
    return response.status(400).json({ error: 'URL parameter is required' });
  }

  if (!apiKey) {
    return response.status(500).json({ error: 'API key is not configured on the server' });
  }

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url as string
  )}&category=ACCESSIBILITY&category=SEO&key=${apiKey}`;

  try {
    const apiResponse = await fetch(endpoint);
    const data = await apiResponse.json();

    if (data.error) {
      return response.status(apiResponse.status).json(data);
    }

    return response.status(200).json(data);
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
} 