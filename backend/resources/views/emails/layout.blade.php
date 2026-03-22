<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Muslim Ad Network</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          {{-- Header --}}
          <tr>
            <td style="background-color:#1a4a2e;padding:28px 40px;text-align:center;border-radius:12px 12px 0 0;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">Muslim Ad Network</span>
            </td>
          </tr>

          {{-- Content --}}
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              @yield('content')
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">© Muslim Ad Network — <a href="mailto:support@muslimadnetwork.com" style="color:#9ca3af;text-decoration:none;">support@muslimadnetwork.com</a></p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">This is an automated email, please do not reply directly to this message.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
