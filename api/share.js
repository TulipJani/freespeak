import { kv } from '@vercel/kv';
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

    // Generate a short, unique ID
    const id = nanoid(6);

    // Store the data in Vercel KV
    await kv.set(id, {
      content,
      font,
      theme,
      createdAt: new Date().toISOString()
    });

    // Return the ID
    res.status(201).json({ id });
  } catch (error) {
    console.error('Share API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 