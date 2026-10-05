import fs from 'node:fs';
import { Pool } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({connectionString:process.env.DATABASE_URL});
const client = await pool.connect();
try {
  await client.query(fs.readFileSync(new URL('../drizzle/artist-media-zone.sql',import.meta.url),'utf8'));
  const result = await client.query("SELECT count(*)::int AS columns FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='artist_image_assets'");
  if (result.rows[0].columns !== 15) throw new Error('Image schema verification failed');
  console.log('Artist media migration applied and verified.');
} finally {client.release();await pool.end();}
