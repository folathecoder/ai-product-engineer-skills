# Next.js Performance & Core Web Vitals Engineering

> **Purpose**: Authoritative playbook for achieving perfect Core Web Vitals (LCP, CLS, INP), optimizing streaming HTTP responses, auditing bundle size, and configuring media optimization in Next.js 16+.

---

## 1. Core Web Vitals Optimization Matrix

| Metric | Target | Primary Culprit in Next.js | Principal Engineering Fix |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | **< 2.5s** | Uncached database call blocking initial HTML; unoptimized hero image; missing `priority`. | Use PPR static shell; push uncached work into `<Suspense>`; add `priority={true}` to hero image; self-host fonts with `next/font`. |
| **CLS** (Cumulative Layout Shift) | **< 0.1** | Images missing dimensions; dynamically inserted banners; web fonts swapping late; mismatched skeleton heights. | Set explicit `width`/`height` or `fill` with aspect-ratio container; use `next/font` CSS variables; build skeletons with exact target dimensions. |
| **INP** (Interaction to Next Paint) | **< 200ms** | Giant JavaScript bundles on client; heavy synchronous re-renders; un-memoized form transitions. | Push `'use client'` to leaf nodes; enable React Compiler (`reactCompiler: true`); wrap mutations in `startTransition` or `useActionState`. |

---

## 2. Image Optimization (`next/image`) in Next.js 16

### Breaking Changes & Security Defaults in v16
- **4-Hour Minimum Cache TTL**: Images without upstream cache headers default to 14,400s cache.
- **Strict Quality Coercion**: Default `qualities` is `[75]`. Custom quality props must be declared in `next.config.ts`.
- **Query String Restrictions**: Local images with query strings (`/photo.jpg?v=1`) require explicit `images.localPatterns.search` config to prevent enumeration attacks.
- **SSRF Protection**: `images.dangerouslyAllowLocalIP` is `false` by default, blocking local network SSRF.

### Canonical Image Usage Patterns

#### Pattern A: Fixed Dimensions (Known Width/Height)
```tsx
import Image from 'next/image'

export function UserAvatar({ url, name }: { url: string, name: string }) {
  return (
    <Image
      src={url}
      alt={name}
      width={48}
      height={48}
      className="rounded-full"
    />
  )
}
```

#### Pattern B: Responsive Hero Image (LCP Candidate)
```tsx
import Image from 'next/image'

export function HeroBanner({ src, alt }: { src: string, alt: string }) {
  return (
    <div className="relative w-full h-[450px] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        priority // Crucial: preloads image in <head> for fast LCP
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        className="object-cover"
      />
    </div>
  )
}
```

### Essential Checklist for `next/image`
- [ ] Every above-the-fold image has `priority={true}` (or `preload={true}`).
- [ ] No image uses `loading="lazy"` if it is candidate for LCP.
- [ ] Every image with `fill` has an explicit `sizes` attribute.
- [ ] Remote domains are configured via `images.remotePatterns` with exact protocol and hostname (never deprecated `domains`).

---

## 3. Font Optimization (`next/font`) & Zero CLS

Google fonts or custom local fonts should **never** be loaded via `<link rel="stylesheet">` tags in `<head>`, which block rendering and cause layout shifts (FOIT/FOUT).

### Canonical Font Setup with CSS Variables

```ts
// src/app/fonts.ts
import { Inter, JetBrains_Mono } from 'next/font/google'

export const sansFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})
```

```tsx
// src/app/layout.tsx
import { sansFont, monoFont } from './fonts'
import '@/styles/globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sansFont.variable} ${monoFont.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

---

## 4. Streaming HTTP & Suspense Boundary Engineering

### How Streaming Works in App Router
1. The server renders and sends the **initial HTML shell** (layouts, static components, and `<Suspense>` fallbacks) immediately.
2. The browser renders the static shell and displays skeletons to the user.
3. As asynchronous Server Components complete on the server, the server streams `<template>` tags containing rendered HTML chunks and inline scripts that swap the skeleton with real content.

### Critical Infrastructure & Buffering Pitfalls
- **NGINX / Reverse Proxy Buffering**: NGINX buffers HTTP responses by default, breaking streaming. Add this header in your proxy or server configuration:
  ```
  X-Accel-Buffering: no
  ```
- **Safari 1024-Byte Initial Buffer**: Safari will not begin rendering a streamed response until it receives at least 1,024 bytes of HTML. Next.js automatically outputs padding characters to satisfy this buffer, but ensure no custom proxy strips them.
- **AWS Lambda / Serverless Streaming**: Verify your cloud adapter or platform supports response streaming (e.g. AWS Lambda Response Streaming with `awslabs/aws-lambda-web-adapter`).

---

## 5. Client Bundle Diet & Turbopack Analysis

### Package Import Optimization (`optimizePackageImports`)
Large icon and utility libraries frequently suffer from the "barrel-file problem," pulling thousands of modules into the bundle. Configure explicit optimizations in `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'lodash-es',
      'date-fns',
    ],
  },
}

export default nextConfig
```

### Analyzing Bundle Size with Turbopack (Next.js 16.1+)
Next.js 16.1 introduced built-in Turbopack bundle analysis:

```bash
# Run Turbopack bundle analysis
next analyze

# Output interactive visual treemap and JSON snapshots
next analyze --output .next/analyze
```

For legacy Webpack builds, configure `@next/bundle-analyzer`:
```bash
ANALYZE=true next build --webpack
```

### Dynamic Code Splitting (`next/dynamic`)
Use `next/dynamic` to defer loading heavy client components that are not needed on initial load (e.g. rich text editors, 3D canvases, modal drawers):

```tsx
'use client'

import dynamic from 'next/dynamic'

const HeavyChart = dynamic(
  () => import('@/components/HeavyChart'),
  {
    ssr: false, // Disables server rendering for purely browser-based canvas
    loading: () => <div className="h-64 animate-pulse bg-muted rounded" />,
  }
)
```
> **Warning**: `ssr: false` is **only** valid inside Client Components (`'use client'`). Using `ssr: false` in a Server Component throws an error.
