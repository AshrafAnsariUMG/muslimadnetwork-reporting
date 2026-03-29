<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Muslim Ad Network</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          {{-- Header --}}
          <tr>
            <td style="background-color:#176293;padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
              @if(!empty($logoUrl))
              <img src="{{ $logoUrl }}" width="60" height="60" alt="Muslim Ad Network"
                style="border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">
              @endif
              <div style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">Muslim Ad Network</div>
              <div style="margin:12px auto 0;width:60px;height:0;border-top:2px solid #C9A84C;"></div>
            </td>
          </tr>

          {{-- Content card --}}
          <tr>
            <td style="background-color:#ffffff;padding:40px 36px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-top:4px solid #A5B300;border-radius:0;">
              @yield('content')
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td style="background-color:#176293;padding:20px 24px;text-align:center;border-radius:0 0 8px 8px;">
              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.8);">
                &copy; {{ date('Y') }} Muslim Ad Network &mdash; A property of Ummah Media Group LLC
              </p>
              <p style="margin:0 0 6px;font-size:12px;">
                <a href="https://muslimadnetwork.com" style="color:#C9A84C;text-decoration:none;">muslimadnetwork.com</a>
                &nbsp;|&nbsp;
                <a href="mailto:support@muslimadnetwork.com" style="color:#C9A84C;text-decoration:none;">support@muslimadnetwork.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);">This is an automated email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
