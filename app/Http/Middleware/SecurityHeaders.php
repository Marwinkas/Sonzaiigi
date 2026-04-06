<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (app()->environment('local')) {
            $response->headers->remove('Content-Security-Policy');
            $response->headers->remove('X-Content-Security-Policy');
            $response->headers->remove('X-WebKit-CSP');

            $policy = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " .
                      "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " .
                      "style-src * 'unsafe-inline'; " .
                      "img-src * data: blob: 'unsafe-inline'; " .
                      "font-src * data:; " .
                      "connect-src * ws: wss:; " .
                      "media-src * data: blob: 'unsafe-inline'; " .
                      "object-src *; " .
                      // 👇 Добавлено специально для Firefox
                      "child-src * blob:; " .
                      "worker-src * blob:;";

            $response->headers->set('Content-Security-Policy', $policy);
        }

        return $response;
    }
}
