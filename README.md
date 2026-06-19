# Fishing Logbook Android

A private, offline-first fishing logbook built with React Native, Expo, and TypeScript.

## Current implementation

- Uses the same top-level logbook collections and trip/catch field names as the self-hosted application.
- Migrates the original prototype's local trip records into the compatible document.
- Creates, views, edits, and deletes complete trips.
- Records detailed landed/lost fish and links them to trolling setup lines.
- Manages people, waterbodies, launches, lures, flashers, rods, reels, and combos.
- Includes guarded download/upload integration for the current whole-document API.
- Shows offline, pending-local-change, synchronized, and error states.
- Runs in a laptop browser or an Android emulator.

Stats, maps, and gallery screens remain outside the submission core.

## Run on this laptop

Node.js 22 or newer is required.

Double-click `run-laptop.cmd`, or run:

```powershell
npm.cmd install
npm.cmd run web
```

Expo prints a local URL, usually `http://localhost:8081`.

PowerShell script execution is restricted on this laptop, so use `npm.cmd` and `npx.cmd` instead of `npm` and `npx`.

## Run as Android

Install Android Studio with an Android 16 / API 36 SDK and create an emulator. Then:

Double-click `run-android.cmd`, or run:

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:Path="$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
npm.cmd run android
```

When Flask runs on the same laptop, use `http://10.0.2.2:8080` as the server URL in the Android emulator. A physical phone must use the laptop's LAN IP, and both devices must be on the same trusted network.

The current Flask API is unauthenticated and HTTP-only. Do not expose it directly to the public internet.

You can also install Expo Go on a compatible physical Android device and run `npm.cmd start`, but SDK 56 support depends on the Expo Go version available for that device.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:roundtrip
```

## Storage

The core stores the canonical logbook document through AsyncStorage and preserves a corrupt payload under a recovery key before resetting. This matches the current whole-document Flask API. A later production sync phase should move domain entities and mutation queues to SQLite.
