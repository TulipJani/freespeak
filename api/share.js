import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Store the data in Supabase
    const { error } = await supabase
      .from('shares')
      .insert({
        id,
        content,
        font,
        theme
      });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to store data' });
    }

    // Return the ID
    res.status(201).json({ id });
  } catch (error) {
    console.error('Share API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 