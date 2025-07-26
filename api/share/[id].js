import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing ID parameter' });
    }

    // Fetch the data from Supabase
    const { data, error } = await supabase
      .from('shares')
      .select('content, font, theme')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Shared content not found' });
    }

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