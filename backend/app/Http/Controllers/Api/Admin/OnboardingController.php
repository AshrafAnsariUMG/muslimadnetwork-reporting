<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\User;
use App\Services\GmailMailerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OnboardingController extends Controller
{
    private static function logoDataUri(): string
    {
        $path = public_path('logo.jpeg');
        if (!file_exists($path)) {
            return '';
        }
        return 'data:image/jpeg;base64,' . base64_encode(file_get_contents($path));
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->role->value !== 'client') {
            return response()->json(['message' => 'Onboarding emails can only be sent to client users.'], 422);
        }

        $newPassword = Str::random(12);
        $user->update(['password' => Hash::make($newPassword)]);

        $loginUrl = config('app.frontend_url') . '/login';

        try {
            $html = view('emails.onboarding', [
                'name'     => $user->name,
                'email'    => $user->email,
                'password' => $newPassword,
                'loginUrl' => $loginUrl,
                'logoUrl'  => self::logoDataUri(),
            ])->render();

            app(GmailMailerService::class)->send(
                $user->email,
                "You're live on Muslim Ad Network 🚀",
                $html
            );
        } catch (\Throwable $e) {
            Log::error('Onboarding email failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to send onboarding email: ' . $e->getMessage()], 500);
        }

        AdminAuditLog::create([
            'admin_user_id'           => $request->user()->id,
            'impersonating_client_id' => null,
            'action'                  => 'onboarding_email_sent',
            'metadata'                => ['user_id' => $user->id, 'email' => $user->email],
            'ip_address'              => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => 'Onboarding email sent to ' . $user->email]);
    }
}
