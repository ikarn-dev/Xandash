# XanDash CAPTCHA Setup

## Overview

XanDash uses Cloudflare Turnstile for CAPTCHA protection. This prevents API abuse while maintaining a smooth user experience.

## Implementation

### Components

1. **TurnstileWidget** (`src/components/ui/TurnstileWidget.tsx`)
   - Renders the Cloudflare Turnstile widget
   - Handles token generation and callbacks

2. **CaptchaGate** (`src/components/ui/CaptchaGate.tsx`)
   - Per-page CAPTCHA gate (strict, no caching)
   - Used for node profile pages

3. **AppCaptchaGate** (`src/components/ui/AppCaptchaGate.tsx`)
   - App-wide CAPTCHA (session-based caching)
   - Wraps the entire application

4. **API Route** (`src/app/api/verify-turnstile/route.ts`)
   - Server-side token verification

## Environment Variables

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

## Getting Turnstile Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Turnstile
3. Create a new site widget
4. Copy Site Key and Secret Key

## Usage

### App-Wide CAPTCHA

Applied in `src/app/layout.tsx`:

```tsx
import { AppCaptchaGate } from '@/components/ui/AppCaptchaGate';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppCaptchaGate>
          {children}
        </AppCaptchaGate>
      </body>
    </html>
  );
}
```

### Per-Page Strict CAPTCHA

Used in node profile pages:

```tsx
import { CaptchaGate } from '@/components/ui/CaptchaGate';

export function NodeProfile({ ip }) {
  return (
    <CaptchaGate
      key={`profile-${ip}-${Date.now()}`}
      title="// NODE_PROFILE_ACCESS"
      description="Verify to view node details."
    >
      {/* Profile content */}
    </CaptchaGate>
  );
}
```

The `key` prop with `Date.now()` forces re-verification on every visit.

## Localhost Bypass

CAPTCHA is automatically skipped on localhost for development:

```tsx
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1');

if (isLocalhost) {
  // Skip CAPTCHA
}
```

## Verification Flow

1. User visits protected page
2. Turnstile widget renders and generates token
3. Token sent to `/api/verify-turnstile`
4. Server verifies with Cloudflare API
5. On success, content is displayed

## Customization

The CAPTCHA UI matches the app theme with:
- Dark background
- Custom terminal-style text
- Animated corner accents
- Responsive design

## Troubleshooting

### CAPTCHA Not Loading

- Check site key is correct
- Verify domain is added in Cloudflare dashboard
- Check browser console for errors

### Verification Failing

- Verify secret key is correct
- Check server logs for Cloudflare API response
- Ensure token is being sent correctly
