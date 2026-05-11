# OmniWTMS Mobile Apps (Expo)

This workspace contains 3 Expo React Native apps:

- `mobile/courier-app`
- `mobile/warehouse-app`
- `mobile/customer-app`

Each app includes:

- offline-first data queue scaffolding (SQLite + replay)
- push notification helper
- biometric auth helper
- dark mode + i18n-ready structure
- placeholders for camera/GPS/chat/maps integrations

## Run

From each app folder:

```bash
npm install
npx expo start
```

## Notes

- Replace API placeholders with real OmniWTMS backend URLs and auth tokens.
- Add native config for Maps/Push/Biometrics per platform before store deployment.
