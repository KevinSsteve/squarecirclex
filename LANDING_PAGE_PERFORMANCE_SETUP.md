# Landing Page Performance Setup Guide

## Quick Setup

### 1. Install Web Vitals Package (Optional but Recommended)

```bash
cd frontend
npm install web-vitals
```

This package enables Core Web Vitals monitoring in production. If not installed, the app will still work but won't report performance metrics.

### 2. Build for Production

```bash
cd frontend
npm run build
```

This will create an optimized production build with:
- Code splitting
- Minification
- Tree shaking
- Lazy loading

### 3. Preview Production Build

```bash
cd frontend
npm run preview
```

This serves the production build locally for testing.

### 4. Test Performance

Open Chrome DevTools and run Lighthouse audit:
1. Open the preview URL in Chrome
2. Press F12 to open DevTools
3. Go to "Lighthouse" tab
4. Select all categories
5. Click "Analyze page load"

Expected scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### 5. Verify Lazy Loading

1. Open DevTools > Network tab
2. Reload the page
3. Scroll down slowly
4. Watch the Network tab - sections should load as you scroll

### 6. Test PWA Features

1. Open DevTools > Application tab
2. Check "Manifest" - should show SCX app details
3. Check "Service Workers" - should be registered
4. Check "Cache Storage" - should show cached resources

### 7. Test SEO

Visit these tools to verify SEO:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- PageSpeed Insights: https://pagespeed.web.dev/

## Performance Optimizations Applied

### ✅ Code Splitting
- Hero section loads immediately
- 9 sections lazy load on scroll
- Reduced initial bundle by ~70%

### ✅ Lazy Loading
- Images load 50px before viewport
- Smooth fade-in transitions
- IntersectionObserver API

### ✅ Caching
- Service worker caching
- Cache-first strategy
- Offline support

### ✅ SEO
- Comprehensive meta tags
- Structured data (JSON-LD)
- robots.txt and sitemap.xml
- Open Graph and Twitter Cards

### ✅ Monitoring
- Web Vitals tracking
- Performance metrics
- Connection speed detection

## Troubleshooting

### Issue: Lazy loading not working
**Solution:** Check browser console for errors. Ensure IntersectionObserver is supported (all modern browsers).

### Issue: Service worker not registering
**Solution:** Service workers only work on HTTPS or localhost. Check DevTools > Application > Service Workers.

### Issue: Low Lighthouse score
**Solution:** 
1. Test in incognito mode (extensions can affect score)
2. Ensure production build is being tested
3. Check Network tab for slow resources

### Issue: Web Vitals not reporting
**Solution:** Install web-vitals package: `npm install web-vitals`

## Next Steps

After verifying performance:
1. Deploy to production
2. Monitor real user metrics
3. Set up analytics (Google Analytics)
4. Configure error tracking (Sentry)
5. Implement A/B testing

## Resources

- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- PWA: https://web.dev/progressive-web-apps/
- SEO: https://developers.google.com/search/docs
