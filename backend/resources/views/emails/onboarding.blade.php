@extends('emails.layout')

@section('content')
  <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">Welcome to Muslim Ad Network! 👋</h1>

  <p style="margin:0 0 12px;font-size:15px;color:#374151;">Dear {{ $name }},</p>

  <p style="margin:0 0 12px;font-size:15px;color:#374151;">
    We're excited to have you on board. Your advertiser reporting dashboard is now ready.
  </p>

  <p style="margin:0 0 20px;font-size:15px;color:#374151;">Here's everything you need to get started:</p>

  {{-- Credentials box --}}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:28px;">
    <tr>
      <td style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;width:140px;">Dashboard URL</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">
              <a href="{{ $loginUrl }}" style="color:#1a4a2e;text-decoration:none;">{{ $loginUrl }}</a>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0;"></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;">Email</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">{{ $email }}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0;"></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;">Password</td>
            <td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;font-family:monospace;">{{ $password }}</td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">You can change your password after logging in.</p>
      </td>
    </tr>
  </table>

  {{-- CTA Button --}}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td align="center">
        <a href="{{ $loginUrl }}" style="display:inline-block;background-color:#1a4a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
          Access Your Dashboard →
        </a>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 12px;font-size:14px;color:#6b7280;">
    If you have any questions, reply to this email or contact your account manager.
  </p>

  <p style="margin:0;font-size:14px;color:#374151;">Best regards,<br><strong>Muslim Ad Network Team</strong></p>
@endsection
