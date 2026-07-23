import { Link } from '@inertiajs/react';
import React from 'react';

interface LogoSealProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const LogoSeal: React.FC<LogoSealProps> = () => {
  return (
    <div>
        <Link href="/" className="flex items-center gap-3">
            <img src="/img/lws-logo.png" alt="LW's by Bubur Kang LW" className="h-48 w-auto" />
        </Link>
    </div>
  );
};

