// Pubkey to name mapping
const NODE_NAMES: Record<string, string> = {
  '3GF69LzCEfPK8RDc4knSSvhZx8eug2m7TDdyVaCip9Wa': 'Karan',
  '9QAGbt1kLfQDLzfgokbbpP4cYT15pcG9bqf7odQZxC9z': 'Ymetro',
  'HHptBfyfRPofH97v71np8pXJnYap1U4QGYer1DWkBhCN': 'SubstanceM2',
  '12z6qfHXTW39rBU3HAL8Q2MEb7Q4ZebwiU9qPqm3ePw5': 'SubstanceM1',
  '2xSVHT4JAyvpmVRVR9fgNnJKRqKGLaieZwxc2sNa4hW8': 'SubstanceM3',
};

export function getNodeName(pubkey: string | null | undefined): string {
  if (!pubkey) return 'N/A';
  return NODE_NAMES[pubkey] || 'N/A';
}

export function hasNodeName(pubkey: string | null | undefined): boolean {
  if (!pubkey) return false;
  return pubkey in NODE_NAMES;
}

export function getAllNodeNames(): Record<string, string> {
  return { ...NODE_NAMES };
}
