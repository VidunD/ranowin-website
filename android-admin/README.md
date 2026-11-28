# Ranowin Admin (Android)

WebView wrapper around the two existing Apps Script admin panels (Baby Bags and T-Shirt/Apparel).
Login, Super Admin / Admin roles and category access are enforced by the backends, not by the app.

Build: push to GitHub, open Actions -> "Build Admin APK" -> Run workflow -> download the
`Ranowin-Admin-APK` artifact (app-debug.apk). If a backend /exec URL changes, edit the two constants
at the top of app/src/main/java/lk/ranowin/admin/MainActivity.java.
