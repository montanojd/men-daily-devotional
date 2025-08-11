# Devotional for Men - React Native App 📱

Una aplicación móvil completa de devocionales cristianos para hombres, construida con React Native, Expo SDK 53, y una arquitectura de monetización robusta usando RevenueCat + AdMob.

## 🚀 Características Principales

### ✨ Funcionalidades Core
- **Devocionales diarios** con contenido espiritual para hombres cristianos
- **Sistema de rachas** para seguimiento del progreso de lectura
- **Favoritos** con persistencia local para contenido destacado
- **Modo offline** con cache de contenido
- **Temas dinámicos** (claro/oscuro) con persistencia de preferencias
- **Navegación por categorías** de vida espiritual

### 💰 Sistema de Monetización Completo

#### RevenueCat Integration (IAP)
- **Configuración robusta** con importación condicional de módulos
- **Planes flexibles**: Semanal, Mensual y Anual
- **Detección automática** de tipos de plan sin dependencias de PACKAGE_TYPE
- **Cache inteligente** de status premium (30s TTL)
- **Manejo de errores** con fallbacks automáticos
- **Restauración de compras** con verificación de entitlements

#### AdMob Integration Avanzada
- **Banner Ads** con configuración remota por Firebase
- **Interstitial Ads** con sistema de cooldown inteligente (60s producción, 10s desarrollo)
- **App Open Ads** con detección de lifecycle y control anti-spam
- **Configuración dinámica** desde Firebase Realtime Database
- **Respeto a usuarios premium** con verificación en tiempo real
- **ATT Compliance** automático para iOS 14.5+

#### Firebase Remote Configuration
- **Control centralizado** de ads desde Firebase Console
- **Activación/desactivación** por tipo de ad
- **Ad Unit IDs** configurables sin necesidad de rebuild
- **Fallbacks automáticos** a Test IDs en caso de error

### 🔒 App Tracking Transparency (ATT)
- **Implementación nativa** de iOS ATT
- **Solicitud automática** con timing óptimo (3s delay)
- **Persistencia de estado** con AsyncStorage
- **Compatibilidad total** con ads no personalizados
- **Debug tools** para desarrollo

### 📊 Funcionalidades Avanzadas
- **Sistema de favoritos** con persistencia AsyncStorage
- **Tracking de progreso** con streaks y completion status
- **Content delivery** desde GitHub con cache inteligente
- **Error handling** robusto con UX friendly
- **Loading states** optimizados

## 🛠 Stack Tecnológico

### Framework & Libraries
- **Expo SDK 53** - Managed workflow
- **React Native 0.79** - Cross-platform framework
- **expo-router** - File-based navigation
- **TypeScript** - Type safety

### Monetización & Analytics
- **react-native-purchases** (RevenueCat) - IAP management
- **react-native-google-mobile-ads** - AdMob integration
- **Firebase Realtime Database** - Remote configuration
- **expo-tracking-transparency** - iOS ATT compliance

### Storage & Cache
- **@react-native-async-storage/async-storage** - Persistent storage
- **expo-secure-store** - Secure credential storage
- **React Query patterns** - Smart caching

### UI & Experience
- **lucide-react-native** - Iconography
- **Inter Font** - Typography
- **Custom theming system** - Dynamic themes

## 📁 Arquitectura del Proyecto

```
project/
├── app/                          # Navegación con expo-router
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Home/Today's devotional
│   │   ├── mens-guide.tsx       # Men's guidance content
│   │   ├── situations.tsx       # Life situations
│   │   └── premium.tsx          # Subscription plans
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx           # 404 page
│
├── components/                   # Componentes reutilizables
│   ├── DevotionalCard.tsx       # Card de devocional con premium gating
│   ├── CategoryBadge.tsx        # Badge de categorías
│   ├── PremiumLock.tsx          # Overlay de premium
│   ├── TopicModal.tsx           # Modal de contenido
│   └── BannerAdWrapper.tsx      # Banner ads wrapper
│
├── services/                     # Servicios de negocio
│   ├── revenuecat.ts            # RevenueCat service (Singleton pattern)
│   ├── adMobService.ts          # AdMob manager con lifecycle
│   ├── attService.ts            # App Tracking Transparency
│   ├── appInit.ts               # Inicialización centralizada
│   ├── adsConfig.ts             # Firebase configuration
│   ├── interstitialManager.ts   # Interstitial ads manager
│   └── appOpenAdManager.ts      # App open ads manager
│
├── hooks/                        # Custom React hooks
│   ├── usePremiumStatus.ts      # Premium status con RevenueCat
│   ├── useDevotionalContent.ts  # Content delivery
│   ├── useReadingProgress.ts    # Progress tracking
│   ├── useFavorites.ts          # Favorites management
│   └── useFrameworkReady.ts     # App initialization
│
├── types/                        # TypeScript definitions
│   ├── devotional.ts            # Content types
│   └── subscription.ts          # RevenueCat & subscription types
│
└── utils/                        # Utilidades
    └── categoryColors.ts         # Theme utilities
```

## 🔧 Configuración e Instalación

### 1. Prerrequisitos
```bash
# Node.js 18+ y npm/yarn
node --version  # >= 18.0.0

# Expo CLI
npm install -g @expo/cli

# iOS Development (macOS only)
xcode-select --install

# Android Development
# Android Studio + SDK configurado
```

### 2. Instalación de Dependencias
```bash
# Clonar repositorio
cd "project"

# Instalar dependencias (ya ejecutado)
npm install

# Verificar compatibilidad Expo
npx expo install --check
```

### 3. Configuración de Servicios

#### RevenueCat Setup
1. **Crear cuenta** en [RevenueCat Dashboard](https://app.revenuecat.com)
2. **Configurar App** con bundle ID: `com.gpapplica.devotionalformenexpo`
3. **Obtener API Keys** (iOS y Android)
4. **Configurar Entitlement**: `mendevotional_premium`
5. **Crear Offerings** con productos:
   - `devotional_weekly` - Plan semanal
   - `devotional_monthly` - Plan mensual  
   - `devotional_annual` - Plan anual

#### Actualizar API Key
```typescript
// services/appInit.ts línea 6
const REVENUECAT_API_KEY = 'appl_YOUR_REAL_IOS_API_KEY_HERE';
```

#### Firebase Configuration (ya configurado)
```javascript
// services/adsConfig.ts
const firebaseConfig = {
  apiKey: 'AIzaSyD4s_yysV9HI4tb7ZIT_87JwzP5lc3QPgY',
  // ... resto de configuración real
};
```

#### AdMob Setup
1. **Crear cuenta** en [AdMob](https://admob.google.com)
2. **Configurar app** con bundle ID correcto
3. **Obtener Ad Unit IDs** para Banner, Interstitial y App Open
4. **Actualizar Firebase** con los IDs reales:

```json
// Firebase Realtime Database path: /admob_config
{
  "bannerAds": {
    "adUnitIdIOS": "ca-app-pub-XXXXXXXX/YYYYYYYYYY",
    "adUnitIdAndroid": "ca-app-pub-XXXXXXXX/ZZZZZZZZZZ",
    "status": true
  },
  "interstitialAds": {
    "adUnitIdIOS": "ca-app-pub-XXXXXXXX/YYYYYYYYYY", 
    "adUnitIdAndroid": "ca-app-pub-XXXXXXXX/ZZZZZZZZZZ",
    "status": true
  },
  "openAds": {
    "adUnitIdIOS": "ca-app-pub-XXXXXXXX/YYYYYYYYYY",
    "adUnitIdAndroid": "ca-app-pub-XXXXXXXX/ZZZZZZZZZZ", 
    "status": true
  }
}
```

### 4. Desarrollo Local
```bash
# Iniciar desarrollo
npx expo start

# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Desarrollo web
npx expo start --web
```

## 🧪 Testing & Debugging

### RevenueCat Testing
```javascript
// Console de debug (desarrollo)
const service = RevenueCatService.getInstance();
await service.configure();
console.log(service.getFormattedOfferings());
```

### AdMob Testing  
```javascript
// Forzar ads en desarrollo
AdMobService.forceShowInterstitialForTesting();
AdMobService.forceShowOpenAdForTesting();

// Ver estado de ads
console.log(await AdMobService.getAdsStatus());
```

### ATT Testing
```javascript
// Debug ATT (solo desarrollo)
ATTService.debugInfo();
ATTService.resetForTesting(); // Reset state
```

## 📱 Build & Deploy

### 1. Preparación para Build
```bash
# Verificar configuración
npx expo-doctor

# Actualizar dependencias
npx expo install --check

# Limpiar cache si es necesario
npx expo start --clear
```

### 2. EAS Build Setup
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login a Expo
eas login

# Configurar build
eas build:configure

# Build para iOS
eas build --platform ios

# Build para Android  
eas build --platform android
```

### 3. App Store Submission
1. **Verificar** que RevenueCat API key sea de producción
2. **Confirmar** que AdMob use Ad Unit IDs reales
3. **Testear** flows de compra en TestFlight
4. **Validar** que ATT funcione correctamente
5. **Submit** a App Store Connect

## 🔄 Estado del Proyecto

### ✅ Completado
- [x] **Arquitectura base** con Expo SDK 53
- [x] **RevenueCat integration** con singleton pattern
- [x] **AdMob integration** con lifecycle management
- [x] **ATT compliance** automático para iOS
- [x] **Firebase remote config** para ads
- [x] **Sistema de favoritos** persistente
- [x] **Reading progress tracking** con streaks
- [x] **Theming system** dinámico
- [x] **Error handling** robusto
- [x] **TypeScript** completamente tipado
- [x] **Premium gating** en toda la UI
- [x] **Cache inteligente** para performance

### 🔧 Configuración Pendiente
- [ ] **RevenueCat API Key** real (reemplazar placeholder)
- [ ] **AdMob Unit IDs** reales en Firebase
- [ ] **App Store Connect** setup
- [ ] **Google Play Console** setup

### 🚀 Ready for Production
La app está **arquitecturalmente completa** y lista para producción. Solo requiere:
1. API keys reales de RevenueCat
2. Ad Unit IDs reales de AdMob
3. Testing en dispositivos reales
4. Submit a stores

## 📋 Notas de Implementación

### Mejoras Técnicas Implementadas
1. **Importación condicional robusta** - RevenueCat se carga dinámicamente con fallbacks
2. **Cache inteligente premium** - 30s TTL para optimizar performance
3. **Sistema de cooldown avanzado** - Previene spam de ads
4. **Lifecycle management** - App open ads con detección de foreground/background
5. **Error boundaries** - Graceful degradation en caso de fallas
6. **Debug tooling** - Extensive logging para troubleshooting

### Compatibilidad
- **iOS**: 14.0+ (ATT requerido para 14.5+)
- **Android**: API level 21+ (Android 5.0+)
- **Expo SDK**: 53.x
- **React Native**: 0.79.x

---

## 🎯 Próximos Pasos

1. **Obtener API keys reales** de RevenueCat y AdMob
2. **Configurar Ad Unit IDs** en Firebase Database
3. **Testear en dispositivos reales** el flow completo
4. **Build de producción** con EAS
5. **Submit a App Store** y Google Play

La aplicación está completamente funcional y lista para deployment. 🚀

---

**Desarrollado con ❤️ para la comunidad cristiana de hombres**
