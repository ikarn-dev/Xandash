import { NextResponse } from 'next/server';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const DAO_ADDRESS = '5JpYydB2VFcxbPGr8xmpefmJw86GQELCk7cB132wRXCa';
const GOVERNANCE_PROGRAM_ID = '4ruGZqLoPVKX27Qm91Qjsqt5AzCtLrhmjKT8ubwHiVZu';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function bs58Decode(str: string): Buffer {
  const bytes: number[] = [];
  for (const c of str) {
    const idx = BASE58_ALPHABET.indexOf(c);
    if (idx === -1) throw new Error('Invalid base58');
    let carry = idx;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const c of str) {
    if (c === '1') bytes.push(0);
    else break;
  }
  return Buffer.from(bytes.reverse());
}

async function rpcCall(method: string, params: unknown[]) {
  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) {
    console.error(`[RPC Error] ${method}:`, data.error);
    return null;
  }
  return data.result;
}

export async function GET() {
  console.log('\n========== DEBUG API ==========');
  
  const DAO_BYTES = bs58Decode(DAO_ADDRESS);
  
  // Fetch all accounts from the governance program
  const result = await rpcCall('getProgramAccounts', [
    GOVERNANCE_PROGRAM_ID,
    { encoding: 'base64' }
  ]) as Array<{ pubkey: string; account: { data: [string, string] } }> | null;

  if (!result) {
    return NextResponse.json({ error: 'No accounts found' });
  }

  // Get type 14 accounts (ProposalV2)
  const type14Accounts = result.filter(acc => {
    const data = Buffer.from(acc.account.data[0], 'base64');
    return data[0] === 14;
  });

  console.log(`Found ${type14Accounts.length} type 14 accounts`);

  // Analyze type 14 accounts
  const samples = type14Accounts.slice(0, 10).map(acc => {
    const data = Buffer.from(acc.account.data[0], 'base64');
    
    // Try to find name string
    let name = '';
    for (let offset = 150; offset < Math.min(data.length - 20, 400); offset++) {
      try {
        const len = data.readUInt32LE(offset);
        if (len > 5 && len < 150 && offset + 4 + len <= data.length) {
          const str = data.slice(offset + 4, offset + 4 + len).toString('utf8');
          if (/^[A-Za-z0-9][\x20-\x7E]{4,}$/.test(str) && !str.includes('\x00')) {
            name = str.trim();
            break;
          }
        }
      } catch {}
    }
    
    return {
      pubkey: acc.pubkey,
      size: data.length,
      name: name || 'Unknown',
      first200hex: data.slice(0, 200).toString('hex'),
      byte65: data[65],
      byte97: data[97],
      byte129: data[129],
    };
  });

  return NextResponse.json({
    programId: GOVERNANCE_PROGRAM_ID,
    totalType14: type14Accounts.length,
    samples,
  });
}
