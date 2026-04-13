/**
 * Bonus Task 3: Bubble Data Migration Script
 * 
 * This script demonstrates how to transform Bubble.io JSON exports into
 * the Supabase PostgreSQL schema. It handles:
 * - Field mapping (e.g., 'Event Name' -> 'event_name')
 * - Enum normalization (Bubble strings -> Postgres Enums)
 * - Deterministic UUID generation for data integrity
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// ── Configuration ─────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Sample Bubble Data ────────────────────────────────────────
const SAMPLE_BUBBLE_ORDERS = [
  {
    "id": "bubble_ord_001",
    "Customer_Name": "Madison Clarke",
    "Event": "Alpha Phi Bid Day 2025",
    "Due Date": "2025-02-28T00:00:00Z",
    "Status": "Proof Ready",
    "Type": "Group Order",
    "Front Description": "Alpha Phi letters with bid day sun motif"
  },
  {
    "id": "bubble_ord_002",
    "Customer_Name": "Tyler Nguyen",
    "Event": "Sigma Chi Derby Days",
    "Due Date": "2025-03-10T00:00:00Z",
    "Status": "Proof Pending",
    "Type": "Get a Link",
    "Front Description": "Sigma Chi crest with Derby Days text"
  }
];

// ── Utilities ────────────────────────────────────────────────
const genDeterministicUUID = (input) => {
  const hash = crypto.createHash('sha1').update(input).digest('hex');
  return `${hash.substr(0, 8)}-${hash.substr(8, 4)}-4${hash.substr(13, 3)}-a${hash.substr(17, 3)}-${hash.substr(20, 12)}`;
};

const mapStatus = (bubbleStatus) => {
  const mapping = {
    'New': 'new',
    'Proof Pending': 'proof_pending',
    'Proof Ready': 'proof_ready',
    'Approved': 'approved',
    'In Production': 'in_production',
    'Shipped': 'shipped',
    'Complete': 'complete'
  };
  return mapping[bubbleStatus] || 'new';
};

const mapOrderType = (bubbleType) => {
  return bubbleType === 'Get a Link' ? 'get_a_link' : 'group_order';
};

// ── Migration Logic ───────────────────────────────────────────
async function migrate() {
  console.log('🚀 Starting Bubble migration...');

  // Dynamically fetch a valid customer to attach the historical orders to
  const { data: userData } = await supabase.from('users').select('id').limit(1).single();
  const validCustomerId = userData?.id;

  if (!validCustomerId) {
    console.error('❌ Failed: No users found in the database. Please create an account or run the seed first.');
    return;
  }

  for (const row of SAMPLE_BUBBLE_ORDERS) {
    const orderId = genDeterministicUUID(row.id);
    
    // In a real migration, we would query the users table by their Bubble email.
    // For this demonstration, we map all historical orders to a valid test customer.
    const customerId = validCustomerId; 

    const transformed = {
      id: orderId,
      customer_id: customerId,
      event_name: row.Event,
      due_date: new Date(row["Due Date"]).toISOString().split('T')[0],
      status: mapStatus(row.Status),
      order_type: mapOrderType(row.Type),
      front_design_description: row["Front Description"],
    };

    console.log(`  -> Syncing Order: ${row.Event} (${orderId})`);

    const { error } = await supabase
      .from('orders')
      .upsert(transformed, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Failed: ${error.message}`);
    } else {
      console.log(`  ✅ Success`);
    }
  }

  console.log('🎉 Migration complete!');
}

migrate();
