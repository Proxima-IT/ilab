<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $appName }}</title>
</head>
<body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
                    <tr>
                        <td style="padding:28px 28px 8px;">
                            <h1 style="margin:0;font-size:22px;line-height:1.3;color:#111827;">{{ $appName }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 28px 0;">
                            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi {{ $name }},</p>
                            <p style="margin:0;font-size:15px;line-height:1.6;">{{ $line }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:26px 28px;">
                            <div style="display:inline-block;letter-spacing:8px;font-size:34px;font-weight:700;color:#111827;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;">
                                {{ $otp }}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 28px;">
                            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">This code will expire in 15 minutes. If you did not request it, you can safely ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
