# Daily Devotional for Men - React Native App

A comprehensive devotional app for Christian men featuring daily devotionals, life situation guidance, and premium content with monetization through RevenueCat and AdMob.

## 🚀 Features

- **Daily Devotionals**: Daily spiritual content with reading streak tracking
- **Life Situations**: Guidance for various life challenges and topics
- **Men's Guide**: Focused content for Christian manhood
- **Premium Subscription**: Monthly and annual plans via RevenueCat
- **Favorites System**: Save and bookmark favorite content
- **Dark/Light Theme**: Automatic theme switching support
- **Monetization**: AdMob banner and interstitial ads for free users
- **Offline Support**: Cached content with automatic refresh

## 📋 Prerequisites

- Node.js 18+
- Expo CLI 
- iOS/Android development environment
- RevenueCat account and app setup
- AdMob account and ad units
- Firebase project with Realtime Database

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. RevenueCat Configuration

1. Create a RevenueCat account and iOS app
2. Set up entitlement: `mendevotional_premium`
3. Create monthly and annual subscription products
4. Update API key in `services/appInit.ts`:

```typescript
const REVENUECAT_API_KEY = 'appl_your_actual_ios_api_key_here';
```

### 3. AdMob Setup

1. Create AdMob account and iOS app
2. Create ad units: Banner, Interstitial, App Open
3. Update `app.json` with your AdMob App ID:

```json
{
  "plugins": [
    ["react-native-google-mobile-ads", {
      "ios_app_id": "ca-app-pub-your-actual-ios-app-id"
    }]
  ]
}
```

4. Update ad unit IDs in Firebase Realtime Database under `admob_config`:

```json
{
  "admob_config": {
    "bannerAds": {
      "adUnitIdIOS": "ca-app-pub-your-banner-id",
      "status": true
    },
    "interstitialAds": {
      "adUnitIdIOS": "ca-app-pub-your-interstitial-id", 
      "status": true
    },
    "openAds": {
      "adUnitIdIOS": "ca-app-pub-your-appopen-id",
      "status": true
    }
  }
}
```

### 4. Firebase Configuration

Firebase is already configured with provided credentials. The database should contain:

- `admob_config` node for ad configuration (as shown above)
- Content is fetched from external GitHub JSON endpoint

### 5. Content Management

The app fetches devotional content from:
`https://raw.githubusercontent.com/devotional-content/men-daily/main/content.json`

Expected format:
```json
{
  "devotionals": {
    "2025-08-10": {
      "title": "Title",
      "verse": "Scripture Reference",
      "text": "Content text",
      "category": "daily",
      "isPremium": false
    }
  },
  "topics": {
    "anxiety": {
      "verse": "Scripture", 
      "text": "Content",
      "category": "emotions",
      "isPremium": false
    }
  },
  "manhood": [
    {
      "title": "Title",
      "verse": "Scripture",
      "text": "Content", 
      "category": "leadership",
      "isPremium": true
    }
  ]
}
```

## 🏗 Build and Deploy

### Development Build

```bash
# iOS Simulator
npx expo run:ios

# iOS Device
npx expo run:ios --device

# Build for testing
eas build --platform ios --profile preview
```

### Production Build

```bash
# Production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## 🎯 Monetization Strategy

### Free Tier
- Limited devotional access
- Banner ads on main screens
- Interstitial ads after actions (mark completed, navigation)
- App open ads on foreground

### Premium Tier  
- Full access to all devotionals
- No advertisements
- Monthly: Dynamic pricing from RevenueCat
- Annual: Dynamic pricing from RevenueCat

### Ad Revenue Optimization
- Remote ad configuration via Firebase
- ATT permission request for iOS 14.5+
- Non-personalized ads fallback
- Cooldown timers for interstitials (2 minutes)

## 📱 Key Features Implementation

### Reading Progress & Streaks
- Tracks daily completion in local storage
- Calculates consecutive reading streaks
- Visual streak counter in header

### Favorites System
- Heart icons on all content cards
- Persistent storage via AsyncStorage
- Dedicated Favorites tab

### Theme System
- Automatic light/dark mode detection
- Manual toggle in tab header
- Persistent preference storage

### Premium Integration
- Real-time RevenueCat status updates
- Automatic content unlocking
- Purchase restoration support

## 🔧 Configuration Files

### Important Files to Configure

1. `services/appInit.ts` - RevenueCat API key
2. `app.json` - AdMob App ID and bundle identifier
3. Firebase Realtime Database - Ad unit IDs and remote configuration

### Environment Variables (Optional)

For additional security, you can use environment variables:

```bash
# .env
REVENUECAT_API_KEY=appl_your_key_here
ADMOB_IOS_APP_ID=ca-app-pub-your-app-id
```

## 🐛 Troubleshooting

### Common Issues

1. **RevenueCat not initializing**: Check API key and network connectivity
2. **Ads not showing**: Verify AdMob app ID and Firebase configuration
3. **Premium status not updating**: Check entitlement name matches RevenueCat dashboard
4. **Content not loading**: Verify GitHub JSON endpoint is accessible

### Debug Mode

In development, the app uses AdMob test ad unit IDs. For production:
1. Replace test IDs with real ad unit IDs in Firebase
2. Test with real devices (not simulators) for accurate ad behavior

## 📄 License

Private/Commercial License - All rights reserved.

## 🆘 Support

For setup assistance:
1. Check RevenueCat documentation for iOS setup
2. Verify AdMob integration following Google's guidelines  
3. Ensure Firebase Realtime Database rules allow read access
4. Test all purchase flows before App Store submission
