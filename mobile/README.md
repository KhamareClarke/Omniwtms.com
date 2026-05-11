# OmniWTMS Mobile Apps (Expo)

This workspace contains 3 Expo React Native apps:

- `mobile/courier-app`
- `mobile/warehouse-app`
- `mobile/customer-app`

Each app includes:

- **Courier:** tabbed UI (Home, Stops, Scan, Pay, Chat, More) with mock route, Maps + dialer handoff, scan field, offline queue viewer, biometric login, push registration.
- **Warehouse:** pick list with scan field + pick toggles, pack/shipment grouping, label print placeholder, settings.
- **Customer:** guest tracking id, open web track URL, sample ETA/courier row, rating stars, order tab.
- offline-first data queue scaffolding (SQLite; clear queue for demos)
- push notification helper (courier)
- biometric auth helper (courier)
- dark mode + i18n-ready structure

## Run

From each app folder:

```bash
npm install
npx expo start
```

## Notes

- Replace API placeholders with real OmniWTMS backend URLs and auth tokens.
- For local dev against the Next.js app, set Expo env var `EXPO_PUBLIC_API_BASE_URL`, e.g. `http://localhost:3020`.
- Add native config for Maps/Push/Biometrics per platform before store deployment.
