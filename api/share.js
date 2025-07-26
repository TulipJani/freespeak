import { createClient } from 'redis';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, font, theme } = req.body;

    if (!content || !font || !theme) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Connect to Redis
    const client = createClient({
      url: process.env.REDIS_URL
    });

    await client.connect();

    // Generate a short, unique ID
    const id = nanoid(6);

    // Store the data in Redis
    await client.set(id, JSON.stringify({
      content,
      font,
      theme,
      createdAt: new Date().toISOString()
    }));

    // Set expiration (optional - 30 days)
    await client.expire(id, 30 * 24 * 60 * 60);

    await client.disconnect();

    // Return the ID
    res.status(201).json({ id });
  } catch (error) {
    console.error('Share API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 