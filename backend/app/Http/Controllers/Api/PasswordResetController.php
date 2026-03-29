<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GmailMailerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PasswordResetController extends Controller
{
    private static function logoDataUri(): string
    {
        $path = public_path('logo.jpeg');
        if (!file_exists($path)) {
            return '';
        }
        return 'data:image/jpeg;base64,' . base64_encode(file_get_contents($path));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $successResponse = response()->json([
            'message' => "If an account exists with that email, you'll receive a reset link shortly.",
        ]);

        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return $successResponse;
        }

        $token       = bin2hex(random_bytes(32));
        $hashedToken = hash('sha256', $token);
        $email       = $user->email;

        DB::table('reporting_password_resets')->where('email', $email)->delete();
        DB::table('reporting_password_resets')->insert([
            'email'      => $email,
            'token'      => $hashedToken,
            'created_at' => now(),
        ]);

        $resetUrl = config('app.frontend_url')
            . '/reset-password?token=' . $token
            . '&email=' . urlencode($email);

        try {
            $html = view('emails.reset_password', [
                'name'      => $user->name,
                'resetUrl'  => $resetUrl,
                'expiresIn' => 60,
                'logoUrl'   => self::logoDataUri(),
            ])->render();

            app(GmailMailerService::class)->send($email, 'Reset your Muslim Ad Network password', $html);
        } catch (\Throwable $e) {
            Log::error('Forgot password email failed', ['email' => $email, 'error' => $e->getMessage()]);
        }

        return $successResponse;
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'                 => ['required', 'email'],
            'token'                 => ['required', 'string'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email       = $request->input('email');
        $hashedToken = hash('sha256', $request->input('token'));

        $record = DB::table('reporting_password_resets')
            ->where('email', $email)
            ->where('token', $hashedToken)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'This password reset link is invalid.'], 422);
        }

        $createdAt = \Carbon\Carbon::parse($record->created_at);
        if ($createdAt->diffInMinutes(now()) > 60) {
            DB::table('reporting_password_resets')->where('email', $email)->delete();
            return response()->json(['message' => 'This password reset link has expired. Please request a new one.'], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 422);
        }

        $user->update(['password' => Hash::make($request->input('password'))]);
        DB::table('reporting_password_resets')->where('email', $email)->delete();

        return response()->json(['message' => 'Password reset successfully. You can now log in.']);
    }
}
