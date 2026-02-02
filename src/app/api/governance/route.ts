import { NextResponse } from 'next/server';
import { getPricesForGovernance } from '@/libs/services/price-service';
import { getHeliusRpcUrl, reportSuccess, reportRateLimitHit, isRateLimitError } from '@/libs/utils/api-key-manager';

// DAO and Token addresses
const DAO_ADDRESS = '5JpYydB2VFcxbPGr8xmpefmJw86GQELCk7cB132wRXCa';
const XAND_MINT = 'XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx';
const XANDSOL_MINT = 'XAnDeUmMcqFyCdef9jzpNgtZPjTj3xUMj9eXKn2reFN';
const COUNCIL_MINT = 'Doa1sW3GyQTw2wfWfGAyxr8Lwh96e7RRNWth3N1EfxdH';

// Pre-computed DAO_ADDRESS bytes for efficient comparison
const DAO_ADDRESS_BYTES = bs58Decode(DAO_ADDRESS);

interface TreasuryBalances {
  sol: number;
  xand: number;
  xandsol: number;
  wallets: Array<{ wallet: string; sol: number; xand: number; xandsol: number }>;
}

// Treasury wallet addresses (main + council)
const TREASURY_WALLETS = {
  main: [
    'Bf2vKvcbpYKWNDcwzFYy3vYNe5WaqWLLPpwmG63CoNUt',
    'A8Baj9TRDH5YSXFuosgr1Eojn3fkmj5ysG6DoqBvYvur',
    '548hoGgQksGBBrMV6yZpPPKCyDcBmJtn7zNAHURcUnAH',
    '2HgKBjfnALwMpChY8ZXR8YePWVejwxq9MWXmXCmvSPMU',
    'FUBGqvghKNgKcSddaxyhrpcbjcxGJtJAfRoBjkyj1DeV',
    '9HE6X3FmBqUYba2S9wqbQNASABHZBVigWSij1bgWL9KL',
    'DX91TwVuqpradg3swfxSQY5ghGN5x8mf593SDLyeX3xH',
    'CaGfz4CkN4otKGsC38r3GfxXAJKmkUSJaJSx6Bfh5Fnt',
  ],
  council: [
    'CaGfz4CkN4otKGsC38r3GfxXAJKmkUSJaJSx6Bfh5Fnt',
  ],
};

// Legacy addresses (for backward compatibility)
const DAO_TREASURY = '3tWGHdmFd5FPqiZbR9r57qLDTnkxLBLAKno71a72ySQk';
const TREASURY_XAND_ACCOUNT = 'G1hpECic1xD2rhkm4HqfrjK5vucfX19nC5d64WDpesC8';

// Use shared price service (uses cached CoinGecko data)
const fetchTokenPrices = getPricesForGovernance;

// SPL Governance Program ID
const GOVERNANCE_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

// Proposal state mapping
const PROPOSAL_STATES: Record<number, string> = {
  0: 'Draft',
  1: 'SigningOff',
  2: 'Voting',
  3: 'Succeeded',
  4: 'Executable',
  5: 'Completed',
  6: 'Cancelled',
  7: 'Defeated',
  8: 'ExecutingWithErrors',
};

// Minimum delay between RPC requests to avoid rate limiting (150ms = ~6.6 req/sec, well under most rate limits)
const RPC_REQUEST_DELAY_MS = 150;
let lastRpcRequestTime = 0;

// Throttled RPC call with automatic delay and retry logic
async function rpcCall(method: string, params: unknown[], retries = 3): Promise<any> {
  // Ensure minimum delay between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRpcRequestTime;
  if (timeSinceLastRequest < RPC_REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, RPC_REQUEST_DELAY_MS - timeSinceLastRequest));
  }
  lastRpcRequestTime = Date.now();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(getHeliusRpcUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });

      // Check for rate limit
      if (isRateLimitError(response)) {
        console.log(`[Governance RPC] Rate limit hit on ${method}, attempt ${attempt + 1}/${retries}`);
        reportRateLimitHit('helius');

        if (attempt < retries - 1) {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          const backoffMs = 500 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        return null;
      }

      const data = await response.json();
      if (data.error) {
        console.error(`[RPC Error] ${method}:`, data.error);
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
          continue;
        }
        return null;
      }

      reportSuccess('helius');
      return data.result;
    } catch (err) {
      console.error(`[RPC Error] ${method} attempt ${attempt + 1}:`, err);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function getTokenSupply(mint: string) {
  return rpcCall('getTokenSupply', [mint]);
}

async function getBalance(address: string) {
  return rpcCall('getBalance', [address]);
}

async function getAccountInfo(address: string) {
  return rpcCall('getAccountInfo', [address, { encoding: 'jsonParsed' }]);
}

async function getTokenLargestAccounts(mint: string) {
  return rpcCall('getTokenLargestAccounts', [mint]);
}

async function getTokenAccountsByOwner(owner: string, mint: string) {
  return rpcCall('getTokenAccountsByOwner', [
    owner,
    { mint },
    { encoding: 'jsonParsed' }
  ]);
}

async function getSignaturesForAddress(address: string, limit = 20) {
  return rpcCall('getSignaturesForAddress', [address, { limit }]);
}

// Parse proposal data from account
function parseProposal(pubkey: string, data: Buffer) {
  try {
    // SPL Governance V3 Proposal structure
    const state = data[65];
    const stateName = PROPOSAL_STATES[state] || 'Unknown';
    const dataStr = data.toString('utf8');

    // Find the proposal name by searching for readable text
    let name = '';

    // Look for common proposal title patterns
    const patterns = [
      /Temporary Moratorium[^]+?Review/,
      /\d{4}\s+DevNet\s+[vp]Node\s+pay[a-z]+/i,
      /[A-Z][a-z]+\s+\d{4}\s+[A-Za-z\s-]+/,
    ];

    for (const pattern of patterns) {
      const match = dataStr.match(pattern);
      if (match) {
        name = match[0].replace(/[^\x20-\x7E]/g, ' ').trim();
        break;
      }
    }

    // If no pattern matched, try to find any readable string > 20 chars
    if (!name) {
      // Search for length-prefixed strings
      for (let offset = 100; offset < Math.min(data.length - 50, 400); offset++) {
        try {
          const len = data.readUInt32LE(offset);
          if (len > 20 && len < 150 && offset + 4 + len <= data.length) {
            const str = data.slice(offset + 4, offset + 4 + len).toString('utf8');
            if (/^[A-Z][\x20-\x7E]{19,}$/.test(str)) {
              name = str;
              break;
            }
          }
        } catch {
          continue;
        }
      }
    }

    if (!name) {
      name = `Proposal ${pubkey.slice(0, 8)}...`;
    }

    return {
      pubkey,
      name: name.slice(0, 100), // Limit length
      state: stateName,
      stateNum: state,
    };
  } catch (error) {
    console.error(`[Parse] Error parsing proposal ${pubkey}:`, error);
    return null;
  }
}


// Fetch proposals from blockchain
async function fetchProposals() {
  const proposals: Array<{ pubkey: string; name: string; state: string; stateNum?: number }> = [];

  try {
    // Fetch all proposals from blockchain using dataSize filter instead of memcmp with base64
    const result = await rpcCall('getProgramAccounts', [
      GOVERNANCE_PROGRAM_ID,
      {
        encoding: 'base64',
        filters: [
          { dataSize: 381 }, // Proposal V2 account size
        ]
      }
    ]);

    if (result && result.length > 0) {
      for (const acc of result) {
        try {
          const data = Buffer.from(acc.account.data[0], 'base64');
          // Check if this is a proposal for our DAO (realm at offset 1)
          const realmBytes = data.slice(1, 33);

          // Use byte comparison instead of string comparison for accuracy
          if (bytesEqual(realmBytes, DAO_ADDRESS_BYTES)) {
            const parsed = parseProposal(acc.pubkey, data);
            if (parsed) proposals.push(parsed);
          }
        } catch {
          continue;
        }
      }
    }
  } catch (error) {
    console.error(`[Proposals] Error fetching from blockchain:`, error);
  }

  // Sort by state (Executable first, then Voting, then others)
  const stateOrder: Record<string, number> = { 'Executable': 0, 'Voting': 1, 'Succeeded': 2, 'Completed': 3, 'Cancelled': 4 };
  proposals.sort((a, b) => (stateOrder[a.state] ?? 99) - (stateOrder[b.state] ?? 99));

  return proposals;
}

// Fetch top members (Token Owner Records) with voting power
async function fetchMembers() {
  try {
    // Fetch token owner records - use dataSize filter instead of base64 memcmp
    const result = await rpcCall('getProgramAccounts', [
      GOVERNANCE_PROGRAM_ID,
      {
        encoding: 'base64',
        filters: [
          { dataSize: 104 }, // Token Owner Record V2 size
        ]
      }
    ]);

    if (result && result.length > 0) {
      // Pre-compute XAND_MINT bytes for comparison
      const xandMintBytes = bs58Decode(XAND_MINT);

      const members = result
        .map((acc: { pubkey: string; account: { data: string[] } }) => {
          try {
            const data = Buffer.from(acc.account.data[0], 'base64');

            // Check account type (byte 0 should be 1 for TOKEN_OWNER_RECORD)
            if (data[0] !== 1) return null;

            // Check realm (bytes 1-33) using byte comparison
            const realmBytes = data.slice(1, 33);
            if (!bytesEqual(realmBytes, DAO_ADDRESS_BYTES)) return null;

            // Check governing token mint (bytes 33-65) using byte comparison
            const mintBytes = data.slice(33, 65);
            if (!bytesEqual(mintBytes, xandMintBytes)) return null;

            // Parse governing_token_owner (32 bytes at offset 65)
            const ownerBytes = data.slice(65, 97);
            const owner = bs58Encode(ownerBytes);

            // Parse governing_token_deposit_amount (8 bytes at offset 97)
            const depositAmount = data.readBigUInt64LE(97);
            const votingPower = Number(depositAmount) / 1e9;

            return {
              address: owner,
              votingPower,
              votes: 0,
              proposals: 0,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter((m: { votingPower: number }) => m.votingPower > 0)
        .sort((a: { votingPower: number }, b: { votingPower: number }) => b.votingPower - a.votingPower)
        .slice(0, 50);

      return members;
    }
    return [];
  } catch (error) {
    console.error(`[Members] Error fetching from blockchain:`, error);
    return [];
  }
}


// Simple base58 encoding
function bs58Encode(bytes: Buffer): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + bytes.toString('hex'));
  let result = '';
  const fiftyEight = BigInt(58);
  while (num > BigInt(0)) {
    result = ALPHABET[Number(num % fiftyEight)] + result;
    num = num / fiftyEight;
  }
  for (const byte of bytes) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result || '1';
}

// Base58 decoding for address comparison
function bs58Decode(str: string): Buffer {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const char of str) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * BigInt(58) + BigInt(idx);
  }
  const hex = num.toString(16).padStart(64, '0');
  return Buffer.from(hex, 'hex');
}

// Compare two byte arrays
function bytesEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Fetch all token balances for a wallet
async function getWalletTokenBalances(wallet: string) {
  // Sequential calls with small delay to avoid rate limiting
  const solBalance = await getBalance(wallet);
  const xandAccounts = await getTokenAccountsByOwner(wallet, XAND_MINT);
  const xandsolAccounts = await getTokenAccountsByOwner(wallet, XANDSOL_MINT);

  const sol = (solBalance?.value || 0) / 1e9;

  let xand = 0;
  if (xandAccounts?.value?.length > 0) {
    xand = xandAccounts.value.reduce(
      (sum: number, acc: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number } } } } } }) =>
        sum + (acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0),
      0
    );
  }

  let xandsol = 0;
  if (xandsolAccounts?.value?.length > 0) {
    xandsol = xandsolAccounts.value.reduce(
      (sum: number, acc: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number } } } } } }) =>
        sum + (acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0),
      0
    );
  }

  return { wallet, sol, xand, xandsol };
}

// Fetch treasury balances from blockchain using sequential calls
async function fetchTreasuryBalances(): Promise<TreasuryBalances> {
  const allWallets = [...TREASURY_WALLETS.main, ...TREASURY_WALLETS.council];

  // Fetch wallet balances sequentially to avoid rate limiting
  const walletBalances: { wallet: string; sol: number; xand: number; xandsol: number }[] = [];

  for (const wallet of allWallets) {
    try {
      const balances = await getWalletTokenBalances(wallet);
      walletBalances.push(balances);
    } catch (error) {
      console.error(`[Treasury] Error fetching balances for ${wallet}:`, error);
      walletBalances.push({ wallet, sol: 0, xand: 0, xandsol: 0 });
    }
  }

  // Calculate totals
  const totals = walletBalances.reduce(
    (acc, wb) => ({
      sol: acc.sol + wb.sol,
      xand: acc.xand + wb.xand,
      xandsol: acc.xandsol + wb.xandsol,
    }),
    { sol: 0, xand: 0, xandsol: 0 }
  );

  return {
    sol: totals.sol,
    xand: totals.xand,
    xandsol: totals.xandsol,
    wallets: walletBalances,
  };
}

export async function GET() {
  try {
    const startTime = Date.now();

    // Sequential data fetching to avoid rate limiting
    // Phase 1: Fetch token prices (external API, no rate limit concern)
    const tokenPrices = await fetchTokenPrices().catch(() => ({
      XAND: 0, xandSOL: 0, SOL: 0, changes: { XAND: 0, SOL: 0 }
    }));

    // Phase 2: Fetch treasury balances sequentially (multiple RPC calls per wallet)
    const treasuryBalances = await fetchTreasuryBalances();

    // Phase 3: Fetch proposals from blockchain
    const proposals = await fetchProposals();

    // Phase 4: Fetch members from blockchain
    const members = await fetchMembers();

    // Phase 5: Get token supplies sequentially
    const xandSupply = await getTokenSupply(XAND_MINT);
    const councilSupply = await getTokenSupply(COUNCIL_MINT);

    // Phase 6: Get largest holders
    const largestHolders = await getTokenLargestAccounts(XAND_MINT);

    // Phase 7: Get recent transactions
    const recentTxs = await getSignaturesForAddress(DAO_ADDRESS, 10);

    // Compute governance counts from fetched data
    const governanceCounts = {
      members: members.length,
      proposals: proposals.length,
      governances: 8, // This is typically a fixed value based on governance structure
    };

    // Count proposals by state from fetched proposals
    const proposalsByState: Record<string, number> = {};
    proposals.forEach((p: { state: string }) => {
      proposalsByState[p.state] = (proposalsByState[p.state] || 0) + 1;
    });

    // Calculate values for each token using cached prices
    const treasuryXandBalance = treasuryBalances.xand;
    const treasurySolBalance = treasuryBalances.sol;
    const treasuryXandsolBalance = treasuryBalances.xandsol;

    const xandValue = treasuryXandBalance * tokenPrices.XAND;
    const xandsolValue = treasuryXandsolBalance * tokenPrices.xandSOL;
    const solValue = treasurySolBalance * tokenPrices.SOL;
    const treasuryValueUsd = xandValue + xandsolValue + solValue;

    // Treasury tokens array for the frontend
    const treasuryTokens = [
      {
        symbol: 'XAND',
        name: 'Xandeum',
        mint: XAND_MINT,
        balance: treasuryXandBalance,
        value: xandValue,
        price: tokenPrices.XAND,
        change24h: tokenPrices.changes.XAND,
        color: '#10b981',
      },
      {
        symbol: 'xandSOL',
        name: 'Xandeum Staked SOL',
        mint: XANDSOL_MINT,
        balance: treasuryXandsolBalance,
        value: xandsolValue,
        price: tokenPrices.xandSOL,
        change24h: 0,
        color: '#8b5cf6',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        mint: 'Native',
        balance: treasurySolBalance,
        value: solValue,
        price: tokenPrices.SOL,
        change24h: tokenPrices.changes.SOL,
        color: '#3b82f6',
      },
    ];

    // Wallet details for display
    const treasuryWallets = treasuryBalances.wallets.map((wb: { wallet: string; sol: number; xand: number; xandsol: number }) => ({
      address: wb.wallet,
      solBalance: wb.sol,
      xandBalance: wb.xand,
      xandsolBalance: wb.xandsol,
      totalValue: (wb.sol * tokenPrices.SOL) + (wb.xand * tokenPrices.XAND) + (wb.xandsol * tokenPrices.xandSOL),
    }));

    const response = {
      dao: {
        address: DAO_ADDRESS,
        name: 'Xandeum DAO',
        description: 'Storage Scaling Solution for Solana',
        programId: GOVERNANCE_PROGRAM_ID,
        treasury: {
          address: DAO_TREASURY,
          wallets: treasuryWallets,
          solBalance: treasurySolBalance,
          xandBalance: treasuryXandBalance,
          xandsolBalance: treasuryXandsolBalance,
          xandTokenAccount: TREASURY_XAND_ACCOUNT,
          valueUsd: treasuryValueUsd,
          tokens: treasuryTokens,
        },
      },
      stats: {
        members: governanceCounts.members,
        proposals: governanceCounts.proposals,
        governances: governanceCounts.governances,
        treasuryValueUsd,
      },
      token: {
        mint: XAND_MINT,
        name: 'XAND',
        symbol: 'XAND',
        decimals: xandSupply?.value?.decimals || 9,
        totalSupply: xandSupply?.value?.uiAmount || 10000000000,
        price: tokenPrices.XAND,
      },
      councilToken: {
        mint: COUNCIL_MINT,
        name: 'Council Token',
        symbol: 'COUNCIL',
        decimals: councilSupply?.value?.decimals || 0,
        totalSupply: councilSupply?.value?.uiAmount || 1,
      },
      governance: {
        parameters: {
          maxVotingTime: '2 days',
          minCommunityTokensToCreateProposal: 5000000,
          minCouncilTokensToCreateProposal: 1,
          proposalCoolOffTime: '12 hours',
          depositExemptProposalCount: 10,
          communityVoteThreshold: '1%',
          councilVoteThreshold: '60%',
          communityVoteTipping: 'Disabled',
          councilVoteTipping: 'Early',
        },
      },
      proposals: {
        total: governanceCounts.proposals,
        byState: proposalsByState,
        recent: proposals,
      },
      members: {
        total: governanceCounts.members,
        topMembers: members,
      },
      largestHolders: (largestHolders?.value || []).slice(0, 10).map((h: { address: string; uiAmount?: number; amount?: string }) => ({
        address: h.address,
        amount: h.uiAmount || parseFloat(h.amount || '0') / 1e9,
      })),
      recentActivity: (recentTxs || []).slice(0, 10).map((tx: { signature: string; blockTime: number; confirmationStatus: string; err: unknown }) => ({
        signature: tx.signature,
        blockTime: tx.blockTime,
        status: tx.confirmationStatus,
        error: !!tx.err,
      })),
      fetchedAt: Date.now(),
    };


    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, max-age=120',
      },
    });
  } catch (error) {
    console.error('[Governance API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch governance data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
