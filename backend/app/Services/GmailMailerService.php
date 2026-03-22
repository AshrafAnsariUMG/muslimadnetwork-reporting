<?php

namespace App\Services;

use Google\Client;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use Illuminate\Support\Facades\Log;

class GmailMailerService
{
    private Gmail $gmail;

    public function __construct()
    {
        $client = new Client();
        $client->setClientId(config('services.gmail.client_id'));
        $client->setClientSecret(config('services.gmail.client_secret'));
        $client->addScope(Gmail::GMAIL_SEND);

        $tokenData = $client->fetchAccessTokenWithRefreshToken(
            config('services.gmail.refresh_token')
        );

        if (isset($tokenData['error'])) {
            throw new \RuntimeException(
                'Gmail token refresh failed: ' . ($tokenData['error_description'] ?? $tokenData['error'])
            );
        }

        $this->gmail = new Gmail($client);
    }

    /**
     * Send an HTML email via Gmail API.
     *
     * @throws \RuntimeException
     */
    public function send(string $to, string $subject, string $htmlBody): bool
    {
        try {
            $from    = config('services.gmail.from_address', 'support@muslimadnetwork.com');
            $rawMime = implode("\r\n", [
                'From: Muslim Ad Network <' . $from . '>',
                'To: ' . $to,
                'Subject: ' . $subject,
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=utf-8',
                '',
                $htmlBody,
            ]);

            $encoded = rtrim(strtr(base64_encode($rawMime), '+/', '-_'), '=');

            $message = new Message();
            $message->setRaw($encoded);

            $this->gmail->users_messages->send('me', $message);

            return true;
        } catch (\Throwable $e) {
            Log::error('GmailMailerService::send failed', [
                'to'      => $to,
                'subject' => $subject,
                'error'   => $e->getMessage(),
            ]);
            throw new \RuntimeException('Failed to send email: ' . $e->getMessage(), 0, $e);
        }
    }
}
