<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerifyMidtransIp
{
    public function handle(Request $request, Closure $next): mixed
    {
        $allowedIps = config('pos.midtrans.allowed_ips', []);
        if (! empty($allowedIps) && ! in_array($request->ip(), $allowedIps)) {
            Log::warning('Midtrans webhook from unknown IP', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            abort(403, 'Forbidden');
        }

        return $next($request);
    }
}
