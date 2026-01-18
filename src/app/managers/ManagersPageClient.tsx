'use client';

import React from 'react';
import { CaptchaGate } from '@/components/ui';
import { ManagersView } from './components/ManagersView';
import type { ValidatorData } from '@/libs/server';

interface ManagersPageClientProps {
    mainnetValidators: ValidatorData[];
    devnetValidators: ValidatorData[];
}

export function ManagersPageClient({ mainnetValidators, devnetValidators }: ManagersPageClientProps) {
    return (
        <CaptchaGate
            title="Access Managers Dashboard"
            description="Please verify you're human to access the Managers dashboard."
            cacheKey="managers-dashboard"
        >
            <ManagersView
                mainnetValidators={mainnetValidators}
                devnetValidators={devnetValidators}
            />
        </CaptchaGate>
    );
}
