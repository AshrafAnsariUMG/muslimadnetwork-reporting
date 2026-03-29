@extends('emails.layout')

@section('content')
  <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1e293b;">As-salamu alaykum, {{ $name }},</p>

  <p style="margin:0 0 12px;font-size:15px;color:#1e293b;">
    Your campaign is officially live on Muslim Ad Network!
  </p>

  <p style="margin:0 0 24px;font-size:15px;color:#1e293b;line-height:1.6;">
    You now have direct access to one of the most engaged Muslim audiences across trusted apps, sites, and community platforms.
    This is more than just ad placement &mdash; it&rsquo;s a chance to connect authentically with a community that values brands who show up for them.
  </p>

  <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1e293b;">Here&rsquo;s what happens next:</p>

  {{-- Icon bullets --}}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;vertical-align:top;width:36px;font-size:20px;">📊</td>
      <td style="padding:12px 0 12px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
        <span style="font-size:14px;font-weight:700;color:#1e293b;">Track your performance</span><br>
        <span style="font-size:14px;color:#64748b;">Log in to your dashboard to monitor impressions, clicks, and campaign performance in real time.</span>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;vertical-align:top;width:36px;font-size:20px;">🎯</td>
      <td style="padding:12px 0 12px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
        <span style="font-size:14px;font-weight:700;color:#1e293b;">Optimise your campaign</span><br>
        <span style="font-size:14px;color:#64748b;">Our team is on hand to help you fine-tune targeting, creatives, and budgets for the best results.</span>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 0;vertical-align:top;width:36px;font-size:20px;">📬</td>
      <td style="padding:12px 0 12px 12px;vertical-align:top;">
        <span style="font-size:14px;font-weight:700;color:#1e293b;">Stay in touch</span><br>
        <span style="font-size:14px;color:#64748b;">Your dedicated account manager will be reaching out within 1&ndash;2 business days. In the meantime, reply to this email with any questions.</span>
      </td>
    </tr>
  </table>

  {{-- Credentials box --}}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7ff;border-left:4px solid #176293;border-radius:4px;margin-bottom:28px;">
    <tr>
      <td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;width:130px;">Dashboard URL</td>
            <td style="padding:6px 0;font-size:13px;font-weight:700;color:#1e293b;font-family:monospace;">
              <a href="{{ $loginUrl }}" style="color:#176293;text-decoration:none;">{{ $loginUrl }}</a>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0;"><hr style="border:none;border-top:1px solid #dbeafe;margin:4px 0;"></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;">Email</td>
            <td style="padding:6px 0;font-size:13px;font-weight:700;color:#1e293b;font-family:monospace;">{{ $email }}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0;"><hr style="border:none;border-top:1px solid #dbeafe;margin:4px 0;"></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;">Password</td>
            <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1e293b;font-family:monospace;">{{ $password }}</td>
          </tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;color:#64748b;">You can change your password after logging in.</p>
      </td>
    </tr>
  </table>

  {{-- CTA Button --}}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td align="center">
        <a href="{{ $loginUrl }}" style="display:inline-block;background-color:#176293;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:6px;margin:24px 0;">
          Access Your Dashboard &rarr;
        </a>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 12px;font-size:15px;color:#1e293b;line-height:1.6;">
    We&rsquo;re genuinely excited to have you on board and look forward to building something meaningful together.
  </p>

  <p style="margin:0 0 20px;font-size:15px;color:#1e293b;">Thank you for trusting us with your brand!</p>

  <p style="margin:0;font-size:15px;color:#1e293b;">Warm regards,<br><strong>Muslim Ad Network Team</strong></p>
@endsection
