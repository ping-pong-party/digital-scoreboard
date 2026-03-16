# PWA Setup Guide

This application includes Progressive Web App (PWA) support, allowing users to install it on their mobile devices and use it like a native app.

## Features

- **Offline Support**: Service worker caches API responses for offline viewing
- **Install Prompt**: Add to home screen on mobile devices
- **Touch-Optimized UI**: Separate mobile interface with large, touch-friendly buttons
- **Auto-Detection**: Automatically shows mobile UI on phones/tablets, kiosk UI on desktop/TV
- **Haptic Feedback**: Vibration feedback on touch interactions
- **Background Sync**: Queue score updates when offline (to be implemented)
- **Push Notifications**: Ready for match notifications (to be implemented)

## Icon Generation

The PWA requires icons in multiple sizes. Generate them from the base SVG:

### Using ImageMagick (Recommended)

```bash
# Install ImageMagick if not installed
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Generate all icon sizes
cd public/icons
for size in 72 96 128 144 152 192 384 512; do
  magick icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done
```

### Using Online Tools

1. Upload `public/icons/icon.svg` to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Download the generated icons
3. Place them in `public/icons/` directory

### Manual Creation

Create PNG files at these sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Testing PWA Locally

### Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to "Application" tab
3. Check "Service Workers" - should show registered worker
4. Check "Manifest" - should show app details
5. Use "Update on reload" during development

### Lighthouse

1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Run PWA audit
4. Should score 100% when properly configured

### Mobile Testing

#### Android (Chrome)
1. Visit the site on mobile Chrome
2. Tap the three-dot menu
3. Select "Add to Home screen"
4. Confirm installation

#### iOS (Safari)
1. Visit the site on mobile Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Confirm installation

## Service Worker Cache Strategy

### API Requests (`/api/*`)
- **Strategy**: Network first, cache fallback
- **Behavior**: Always tries network, falls back to cache if offline
- **Benefit**: Real-time data when online, graceful degradation offline

### Static Assets (HTML, CSS, JS, images)
- **Strategy**: Cache first, network fallback
- **Behavior**: Serves from cache if available, fetches from network if not
- **Benefit**: Fast loading, works offline

## Deployment Notes

### HTTPS Required
PWA features require HTTPS in production. Service workers will not register on HTTP (except localhost).

### Cache Versioning
Update `CACHE_NAME` in `public/sw.js` when deploying new versions to force cache refresh:

```javascript
const CACHE_NAME = 'ping-pong-party-v2'; // increment version
```

### Testing Production Build

```bash
npm run build
npm run preview
```

Then visit `http://localhost:4321` and test PWA features.

## Mobile vs Desktop Detection

The app automatically detects device type:

- **Mobile/Tablet**: Shows `MobileHome` component with touch UI
- **Desktop/TV**: Shows `Scoreboard` component with keyboard UI

Detection happens in `src/utils/device.ts` and is used by `src/components/AdaptiveHome.tsx`.

## Known Issues

- Icons need to be generated (see Icon Generation above)
- Background sync not yet implemented
- Push notifications not yet implemented
- Pull-to-refresh gesture not yet implemented

## Future Enhancements

- [ ] Background sync for offline score updates
- [ ] Push notifications for match start/end
- [ ] Pull-to-refresh gesture
- [ ] Share match results
- [ ] Install prompt banner
- [ ] Periodic background sync for leaderboard updates
