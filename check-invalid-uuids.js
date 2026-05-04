#!/usr/bin/env node

// Script to check invalid UUIDs in bag_discs
// Run with: node check-invalid-uuids.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://you-must-set-NEXT_PUBLIC_SUPABASE_URL.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!ANON_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  process.exit(1);
}

async function checkInvalidUUIDs() {
  try {
    console.log('Fetching all bag_discs...');
    const bagDiscsRes = await fetch(`${SUPABASE_URL}/rest/v1/bag_discs?select=user_id`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      }
    });

    if (!bagDiscsRes.ok) {
      throw new Error(`Failed to fetch bag_discs: ${bagDiscsRes.status}`);
    }

    const bagDiscs = await bagDiscsRes.json();
    const uniqueUserIds = [...new Set(bagDiscs.map(d => d.user_id))];

    console.log('\nFetching all players...');
    const playersRes = await fetch(`${SUPABASE_URL}/rest/v1/players?select=id`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      }
    });

    if (!playersRes.ok) {
      throw new Error(`Failed to fetch players: ${playersRes.status}`);
    }

    const players = await playersRes.json();
    const validIds = new Set(players.map(p => p.id));

    console.log('\n=== SUMMARY ===');
    console.log(`Total bag discs: ${bagDiscs.length}`);
    console.log(`Unique user_ids in bag_discs: ${uniqueUserIds.length}`);
    console.log(`Valid player IDs: ${validIds.size}`);

    const invalidIds = uniqueUserIds.filter(id => !validIds.has(id));
    console.log(`\n=== INVALID USER IDs (${invalidIds.length}) ===`);

    for (const id of invalidIds) {
      const count = bagDiscs.filter(d => d.user_id === id).length;
      console.log(`  ${id}: ${count} discs`);
    }

    console.log('\n=== KNOWN MAPPINGS (from previous messages) ===');
    console.log('  e33d8a43-3646-40ec-a92d-d1ff654c155d → jeffrey-rijkse');
    console.log('  c60544c5-faad-4605-9164-0d122ab0dce2 → mathieu-jacob');
    console.log('  62e39edd-90a7-45ef-b99c-801909f576fa → reginald-roth (needs confirmation)');
    console.log('  [missing UUID] → john-cormier (needs UUID)');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkInvalidUUIDs();
