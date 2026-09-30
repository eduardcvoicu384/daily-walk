# Daily Walk

A private, offline app for walking in freedom, one day at a time.
All data stays on your device. No accounts, no servers, no cost.

## Phase 1 features
- Streak counter with a sunrise that rises toward your next milestone
- "I'm struggling right now" rescue screen: 5-minute timer, breathing guide, scripture, prayer, one-tap text/call to your accountability partner
- Urge log (intensity, feelings, situation, what you did instead)
- "I slipped" restart with a grace-based reflection
- Journal with stats
- Optional 4-digit PIN lock
- Export / import backup

## Bible translations
- **KJV** is built in (public domain).
- **VDC** (Cornilescu) and **NTR** are copyrighted, so their text is not in this repo. Pick one in Settings → Bible, then tap "Add VDC/NTR verses": each verse has an "Open in VDC/NTR" link to the Bible app; copy the verse and paste it in. The text is stored only on your phone and included in your backups. Verses you haven't added yet show in KJV.

## Files
| File | What it is |
|---|---|
| `index.html` | Page structure |
| `styles.css` | All visuals. Colors and fonts are at the top |
| `app.js` | App logic |
| `verses.js` | Verse list with KJV text and Romanian references, prayers, milestones, escape actions |
| `sw.js` | Offline support |
| `manifest.webmanifest`, `icons/` | Home-screen app name and icon |

## Put it on GitHub Pages
1. Create a new repository on GitHub (it can have a neutral name, e.g. `daily-walk`).
2. Upload all the files in this folder, keeping the `icons` folder.
3. Go to **Settings → Pages**, set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute your app is live at `https://YOUR-USERNAME.github.io/daily-walk/`.

Note: on a free GitHub account the repository must be public for Pages to work. That only exposes the app's code, never your entries, which live only on your phone.

## Install on iPhone
1. Open the link in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Open it from the home screen icon. It works offline after the first load.

## Test on your computer
In this folder run `python3 -m http.server 8000` and open http://localhost:8000.

## Updating
After changing any file, bump the version in `sw.js` (`daily-walk-v2` → `daily-walk-v3`) and push. The app picks up the new version the next time it's opened with internet.

Your data is not affected by updates. Export a backup now and then anyway (Settings → Backup), because deleting the home-screen icon deletes the data.
