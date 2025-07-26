import { createClient } from 'redis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing ID parameter' });
    }

    // Connect to Redis
    const client = createClient({
      url: process.env.REDIS_URL
    });

    await client.connect();

    // Fetch the data from Redis
    const dataString = await client.get(id);

    await client.disconnect();

    if (!dataString) {
      return res.status(404).json({ error: 'Shared content not found' });
    }

    // Parse the JSON data
    const data = JSON.parse(dataString);

    // Return the data
    res.status(200).json({
      content: data.content,
      font: data.font,
      theme: data.theme
    });

  } catch (error) {
    console.error('Fetch shared content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 