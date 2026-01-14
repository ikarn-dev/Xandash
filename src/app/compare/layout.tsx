import type { Metadata } from 'next';
import { metadata } from './metadata';

export { metadata };

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
