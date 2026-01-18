'use client';

import Image from 'next/image';
import managerLogo from '../../../../../public/logo/manager_logo.jpg';

interface ManagerLogoProps {
  size?: number;
  className?: string;
}

export function ManagerLogo({ size = 40, className = '' }: ManagerLogoProps) {
  return (
    <div 
      className={`rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden bg-black/40 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image 
        src={managerLogo} 
        alt="Manager" 
        width={size} 
        height={size}
        className="object-cover"
      />
    </div>
  );
}
