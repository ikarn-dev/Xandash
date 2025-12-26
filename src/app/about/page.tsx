import React from 'react';
import { DashboardLayout } from '@/components/layout';
import { DocsClient } from './DocsClient';

export default function DocsPage() {
  return (
    <DashboardLayout>
      <DocsClient />
    </DashboardLayout>
  );
}
