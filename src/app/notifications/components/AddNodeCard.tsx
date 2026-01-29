'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CornerAccents } from '@/components/ui';
import { Icons, LoadingButton, CardHeader } from './ui';

interface AddNodeCardProps {
    network: string;
    onNodeAdded: () => void;
}

export function AddNodeCard({ network, onNodeAdded }: AddNodeCardProps) {
    const [nodeIp, setNodeIp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!nodeIp || !ipRegex.test(nodeIp)) {
            toast.error('Please enter a valid IP address');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/notifications/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodeIp, network }),
            });
            const data = await res.json();

            if (data.success) {
                setNodeIp('');
                toast.success(`Node ${nodeIp} added successfully`);
                onNodeAdded();
            } else {
                toast.error(data.error || 'Failed to add node');
            }
        } catch {
            toast.error('Failed to add node');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
            <CornerAccents />
            <div className="relative z-10">
                <CardHeader icon={Icons.node} title="Add Node" />
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={nodeIp}
                        onChange={(e) => setNodeIp(e.target.value)}
                        placeholder="Node IP (e.g., 192.168.1.1)"
                        className="flex-1 min-w-0 p-2.5 bg-black/60 border border-white/20 text-white text-sm font-mono focus:border-purple-500/50 focus:outline-none placeholder:text-white/30 transition-colors"
                        required
                    />
                    <LoadingButton
                        type="submit"
                        loading={loading}
                        variant="primary"
                        className="shrink-0"
                    >
                        {Icons.plus}
                        <span>Add</span>
                    </LoadingButton>
                </form>
                <p className="text-white/40 text-xs mt-2">
                    Network: <span className="text-white/60">{network}</span>
                </p>
            </div>
        </div>
    );
}
