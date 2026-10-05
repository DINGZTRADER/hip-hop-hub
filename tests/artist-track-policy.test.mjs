import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('all artist entry points describe one MP3 without a required preview', () => {
  for (const file of ['src/app/page.tsx', 'src/app/pricing/page.tsx', 'src/app/dashboard/page.tsx', 'src/app/dashboard/onboarding/ArtistOnboarding.tsx']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /minimum 3 MP3|Min 3|Max 10|3 to 10|Preview Stream URL|Unlimited Track Uploads|previewUrl: ""/i, file);
  }
});
