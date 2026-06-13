# Implementation Guide - Disaster Effects & Security

## 1. Adding Disaster Effects to Pages

### Step 1: Import the Component

```typescript
import DisasterEffects from '@/components/ui/DisasterEffects/DisasterEffects';
```

### Step 2: Add to Any Page

```typescript
export default function YourPage() {
  return (
    <div>
      {/* Add disaster effects overlay */}
      <DisasterEffects theme="general" intensity="medium" />
      
      {/* Your page content */}
      <section>
        <h1>Your Content</h1>
      </section>
    </div>
  );
}
```

### Available Themes:
- `general` - Mixed effects (rain + smoke)
- `flood` - Rain/water effects
- `fire` - Ember/fire particles
- `storm` - Heavy rain + wind effects
- `earthquake` - Shake animation

### Intensity Levels:
- `low` - 15 particles
- `medium` - 30 particles (default)
- `high` - 50 particles

### Example Usage by Page:

```typescript
// Home page - General disaster awareness
<DisasterEffects theme="general" intensity="medium" />

// News page - Breaking alerts
<DisasterEffects theme="storm" intensity="high" />

// Reports page - Subtle professional look
<DisasterEffects theme="general" intensity="low" />

// Event page - Dynamic engagement
<DisasterEffects theme="flood" intensity="medium" />
```

---

## 2. Security Implementation Steps

### Priority 1: Install Security Dependencies

```bash
# Input validation
npm install zod

# Rate limiting (if using Upstash)
npm install @upstash/ratelimit @upstash/redis

# Sanitization for HTML content
npm install isomorphic-dompurify

# Authentication
npm install next-auth bcryptjs
npm install -D @types/bcryptjs
```

### Priority 2: Create Validation Schemas

Create `src/lib/validation.ts`:

```typescript
import { z } from 'zod';

export const newsArticleSchema = z.object({
  headline: z.string().min(1).max(200),
  excerpt: z.string().max(500),
  source: z.string().min(1).max(100),
  external_link: z.string().url(),
  category: z.enum(['flood', 'earthquake', 'cyclone', 'wildfire', 'drought', 'climate']),
  published_date: z.string().datetime(),
});

export const reportSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(1000),
  category: z.string().min(1).max(100),
  source: z.string().min(1).max(100),
  download_url: z.string().url(),
  year: z.number().int().min(2000).max(2100),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});
```

### Priority 3: Secure API Routes

Create `src/lib/api-security.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting tracker (in-memory, use Redis in production)
const requests = new Map<string, number[]>();

export function rateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const userRequests = requests.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  requests.set(ip, recentRequests);
  return true;
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 1000); // Limit length
}

export function createSecureResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    }
  });
}
```

### Priority 4: Update API Routes

Example: `src/app/api/news/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { newsArticleSchema } from '@/lib/validation';
import { rateLimit, createSecureResponse } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  // Rate limiting
  if (!rateLimit(request, 20, 60000)) {
    return createSecureResponse(
      { error: 'Too many requests' },
      429
    );
  }

  try {
    // Your data fetching logic
    const news = await fetchNews();
    return createSecureResponse(news);
  } catch (error) {
    console.error('API Error:', error);
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting
  if (!rateLimit(request, 5, 60000)) {
    return createSecureResponse(
      { error: 'Too many requests' },
      429
    );
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validated = newsArticleSchema.parse(body);
    
    // Process validated data
    // ...
    
    return createSecureResponse(
      { success: true },
      201
    );
  } catch (error) {
    if (error.name === 'ZodError') {
      return createSecureResponse(
        { error: 'Invalid input', details: error.errors },
        400
      );
    }
    
    console.error('API Error:', error);
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
```

---

## 3. Environment Variables Setup

Create `.env.local`:

```bash
# Public variables (accessible in browser)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Private variables (server-only)
DATABASE_URL=postgresql://user:password@localhost:5432/dcrs
API_SECRET_KEY=your-secret-key-here
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Redis for rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 4. Testing Checklist

### Manual Testing:

1. **XSS Testing:**
   ```javascript
   // Try submitting: <script>alert('XSS')</script>
   // Should be escaped or rejected
   ```

2. **SQL Injection Testing:**
   ```sql
   -- Try inputs like: ' OR '1'='1
   -- Should be rejected or escaped
   ```

3. **Rate Limiting:**
   ```bash
   # Send 20 requests rapidly
   for i in {1..20}; do curl http://localhost:3000/api/news; done
   # Should get 429 after limit
   ```

4. **CSP Validation:**
   - Open browser DevTools
   - Check Console for CSP violations
   - Fix any reported issues

### Automated Testing:

```bash
# Security audit
npm audit

# Dependency check
npm outdated

# Run tests (if configured)
npm test
```

---

## 5. Deployment Security

### Pre-Deployment Checklist:

- [ ] All environment variables set in production
- [ ] HTTPS enabled
- [ ] Security headers verified
- [ ] Rate limiting configured
- [ ] Error messages sanitized
- [ ] Sensitive data removed from client bundle
- [ ] Dependencies updated and audited
- [ ] CSP policy tested
- [ ] Authentication working
- [ ] CORS properly configured

### Vercel Deployment (Example):

```bash
# Set environment variables
vercel env add DATABASE_URL production
vercel env add API_SECRET_KEY production
vercel env add NEXTAUTH_SECRET production

# Deploy
vercel --prod
```

### Post-Deployment:

1. Test all API endpoints
2. Verify security headers: https://securityheaders.com
3. Check SSL: https://www.ssllabs.com/ssltest/
4. Monitor error logs
5. Set up alerts for suspicious activity

---

## 6. Monitoring Setup

Create `src/lib/monitoring.ts`:

```typescript
export function logSecurityEvent(event: {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'suspicious';
  ip?: string;
  details: string;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...event
  };
  
  console.warn('[SECURITY]', JSON.stringify(logEntry));
  
  // Send to monitoring service (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToMonitoring(logEntry);
  // }
}

export function logAPICall(request: {
  method: string;
  path: string;
  ip?: string;
  status: number;
  duration: number;
}) {
  console.info('[API]', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...request
  }));
}
```

---

## 7. Maintenance Schedule

### Daily:
- Review error logs
- Check for failed login attempts

### Weekly:
- Review API usage patterns
- Check for unusual traffic

### Monthly:
- Run `npm audit`
- Update dependencies
- Review access logs

### Quarterly:
- Full security audit
- Penetration testing
- Update security documentation

---

## Quick Start Commands

```bash
# Install all security dependencies
npm install zod isomorphic-dompurify next-auth bcryptjs @upstash/ratelimit @upstash/redis

# Run security audit
npm audit

# Fix auto-fixable issues
npm audit fix

# Check for updates
npm outdated

# Test the application
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Support & Resources

- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Zod Documentation](https://zod.dev/)
- [NextAuth.js](https://next-auth.js.org/)

---

**Last Updated:** June 13, 2026
