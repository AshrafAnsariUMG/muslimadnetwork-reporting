<?php

namespace App\Http\Controllers\Api;

use Google\Client;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class GmailAuthController extends Controller
{
    private function makeClient(): Client
    {
        $client = new Client();
        $client->setClientId(config('services.gmail.client_id'));
        $client->setClientSecret(config('services.gmail.client_secret'));
        $client->setRedirectUri(config('services.gmail.redirect_uri'));
        $client->addScope('https://mail.google.com/');
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        return $client;
    }

    public function connect()
    {
        $url = $this->makeClient()->createAuthUrl();
        return redirect($url);
    }

    public function callback(Request $request)
    {
        $code = $request->query('code');

        if (!$code) {
            return response('Missing authorization code.', 400);
        }

        $client = $this->makeClient();
        $token  = $client->fetchAccessTokenWithAuthCode($code);

        $refreshToken = $token['refresh_token'] ?? null;

        if ($refreshToken) {
            $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gmail OAuth — Success</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 20px; color: #1a202c; }
    h1 { color: #065f46; font-size: 1.4rem; margin-bottom: 8px; }
    p { color: #4a5568; font-size: 0.95rem; margin: 6px 0; }
    textarea {
      width: 100%; margin-top: 16px; padding: 12px; font-family: monospace;
      font-size: 0.85rem; border: 2px solid #10b981; border-radius: 8px;
      background: #f0fdf4; color: #064e3b; resize: vertical; min-height: 80px;
    }
    .note { margin-top: 20px; padding: 12px 16px; background: #fef3c7; border-radius: 8px; font-size: 0.85rem; color: #92400e; }
  </style>
</head>
<body>
  <h1>✓ SUCCESS — Gmail OAuth token generated</h1>
  <p>Copy your Gmail refresh token below:</p>
  <textarea onclick="this.select()">{$refreshToken}</textarea>
  <p style="margin-top:12px;">Paste this into your <code>.env</code> as:</p>
  <p><code>GMAIL_REFRESH_TOKEN={$refreshToken}</code></p>
  <div class="note">
    <strong>Important:</strong> The Gmail OAuth account must be <strong>support@muslimadnetwork.com</strong> —
    make sure you approved with that account.
  </div>
</body>
</html>
HTML;
            return response($html, 200)->header('Content-Type', 'text/html');
        }

        // No refresh token — show full response for debugging
        $dump = htmlspecialchars(json_encode($token, JSON_PRETTY_PRINT));
        $html = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Gmail OAuth — No Refresh Token</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 20px;}
pre{background:#f7fafc;padding:16px;border-radius:8px;overflow:auto;font-size:0.8rem;}</style>
</head>
<body>
  <h1 style="color:#dc2626;">No refresh_token in response</h1>
  <p>The account may have already granted access without the consent prompt.
     Try revoking access at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> and retry.</p>
  <p>Full response:</p>
  <pre>{$dump}</pre>
</body>
</html>
HTML;
        return response($html, 200)->header('Content-Type', 'text/html');
    }
}
