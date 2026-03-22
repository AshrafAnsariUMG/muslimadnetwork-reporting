@extends('emails.layout')

@section('content')
  <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">Password Reset Request</h1>

  <p style="margin:0 0 12px;font-size:15px;color:#374151;">Dear {{ $name }},</p>

  <p style="margin:0 0 12px;font-size:15px;color:#374151;">
    We received a request to reset your password for your Muslim Ad Network account.
  </p>

  <p style="margin:0 0 28px;font-size:15px;color:#374151;">
    Click the button below to reset your password. This link will expire in <strong>{{ $expiresIn }} minutes</strong>.
  </p>

  {{-- CTA Button --}}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td align="center">
        <a href="{{ $resetUrl }}" style="display:inline-block;background-color:#1a4a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
          Reset Password →
        </a>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
    If you did not request a password reset, please ignore this email. Your password will not be changed.
  </p>

  {{-- Security note --}}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:0 6px 6px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          <strong>Security note:</strong> For your protection, this link expires in {{ $expiresIn }} minutes and can only be used once.
        </p>
      </td>
    </tr>
  </table>

  <p style="margin:0;font-size:14px;color:#374151;">Best regards,<br><strong>Muslim Ad Network Team</strong></p>
@endsection
