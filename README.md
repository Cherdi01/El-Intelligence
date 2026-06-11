# ELI 🌻 – Vom Projekt zur iOS-App (ohne eigenen Mac)

Dieses Paket enthält alles, um ELI als echte iOS-App zu bauen, auf dem iPhone
zu testen (über TestFlight) und in den App Store hochzuladen.

```
eli-app/
├─ www/                 ← die App (HTML/JS/CSS) + Icons
│  ├─ index.html
│  ├─ manifest.json
│  └─ icon-*.png
├─ api/
│  └─ generate.js       ← Vercel-Proxy (hält den API-Schlüssel geheim)
├─ assets/
│  ├─ icon.png          ← 1024er App-Icon (Quelle für alle Größen)
│  └─ splash.png        ← Startbildschirm
├─ capacitor.config.json
├─ package.json
├─ codemagic.yaml       ← Cloud-iOS-Build (kein Mac nötig)
└─ vercel.json
```

Es gibt **zwei getrennte Deployments**:
1. **Backend (Vercel)** – die kleine Funktion in `api/`, die den Schlüssel hält.
2. **App (Capacitor + Codemagic)** – der Rest, der zur iPhone-App wird.

---

## TEIL 1 – Backend-Proxy auf Vercel (≈ 10 Min)

Warum? Der API-Schlüssel darf **niemals** in der App stehen, sonst kann ihn
jeder auslesen. Der Proxy hält ihn geheim. Wir nutzen die **kostenlose
Gemini-Stufe** (Modell `gemini-2.5-flash-lite`).

1. **Kostenlosen Gemini-Schlüssel holen:** auf https://aistudio.google.com/apikey
   einloggen (Google-Konto), „Create API key" – **keine Kreditkarte nötig**.
   Der Schlüssel sieht etwa so aus: `AIza...`.
2. Konto auf https://vercel.com erstellen (kostenlos, GitHub-Login geht).
3. Lege ein GitHub-Repo an und lade den Inhalt von `eli-app/` hoch
   (oder nutze die Vercel-CLI: `npm i -g vercel` dann `vercel` im Ordner).
4. In Vercel: **Project → Settings → Environment Variables** anlegen:
   - Name: `GEMINI_API_KEY`
   - Wert: dein Schlüssel aus Schritt 1
5. **Deploy** klicken. Du bekommst eine URL, z. B. `https://eli-proxy.vercel.app`.
   Dein Proxy-Endpunkt ist dann `https://eli-proxy.vercel.app/api/generate`.

➡️ Diese URL jetzt in der App eintragen: Datei **`www/index.html`** öffnen,
oben im `<script>` die Zeile suchen:

```js
const BACKEND_URL = 'https://DEINE_VERCEL_URL.vercel.app/api/generate';
```
und durch deine echte URL ersetzen. Speichern.

> 💡 **Datenweitergabe:** In der kostenlosen Gemini-Stufe darf Google die
> Eingaben zur Verbesserung seiner Modelle verwenden. Bei Lerntexten meist
> unkritisch, **muss aber in der Datenschutzerklärung erwähnt werden**, sobald
> die App im App Store ist. Willst du das vermeiden, in der Google-Cloud
> Abrechnung aktivieren (Tier 1) – dann entfällt die Datenweitergabe und du
> zahlst nur nach Verbrauch (Centbeträge).

> 💡 **Tageslimit:** In `www/index.html` steht `const DAILY_LIMIT = 30;` –
> so viele Quizze sind pro Gerät und Tag möglich. Wert anpassen oder auf `0`
> setzen (= kein Limit). Schützt vor versehentlicher Vielnutzung.

---

## TEIL 2 – App bauen mit Capacitor + Codemagic (kein Mac nötig)

Da Xcode nur auf macOS läuft, baut **Codemagic** die App auf einem Cloud-Mac.

### 2a. Projekt vorbereiten (auf deinem Windows/Linux-PC)
Voraussetzung: Node.js installiert (https://nodejs.org).

```bash
cd eli-app
npm install
npx cap add ios        # legt den ios/-Ordner an (Build kommt später in der Cloud)
npx cap sync ios
```

Lade danach das gesamte Projekt in ein **GitHub-Repo** (kann dasselbe wie für
Vercel sein – Vercel nutzt `api/`, Codemagic nutzt den Rest).

### 2b. Apple vorbereiten
1. Auf https://appstoreconnect.apple.com mit deinem Developer-Account einloggen.
2. **Apps → +** → neue App anlegen:
   - Name: `ELI`
   - Bundle-ID: `de.elena.eli`  (muss exakt zu `capacitor.config.json` passen)
   - Sprache: Deutsch
3. Unter **Benutzer & Zugriff → Integrationen → App Store Connect API**
   einen API-Schlüssel erzeugen (für Codemagic).

### 2c. Codemagic einrichten
1. Konto auf https://codemagic.io (kostenloses Kontingent vorhanden).
2. GitHub-Repo verbinden.
3. **Teams/Integrations → App Store Connect** mit dem Apple-API-Schlüssel
   verbinden und der Integration einen Namen geben.
   ⚠️ Diesen Namen in `codemagic.yaml` bei `app_store_connect:` eintragen
   (steht dort aktuell als `CodemagicAppStore`).
4. Code Signing: **Automatic** für Bundle-ID `de.elena.eli` aktivieren.
5. Build starten. Codemagic baut die `.ipa` und lädt sie zu **TestFlight**.

### 2d. Auf dem iPhone testen
1. **TestFlight**-App aus dem App Store aufs iPhone laden.
2. In App Store Connect dich selbst als Tester hinzufügen (interne Gruppe).
3. Einladung kommt per Mail → in TestFlight öffnen → ELI installieren → testen. 🎉

---

## TEIL 3 – Echte Veröffentlichung (wenn du zufrieden bist)

Für das öffentliche Release brauchst du zusätzlich:
- **Datenschutzerklärung** (Pflicht): Hochgeladene Texte gehen an deinen Proxy
  → Google Gemini. In der Gratis-Stufe kann Google sie zum Training nutzen –
  das muss erwähnt werden.
- **App-Datenschutz-Angaben** in App Store Connect ausfüllen ("Privacy Nutrition Label").
- **Screenshots** (iPhone 6.7" und 6.5") + Beschreibung + Keywords.
- In `codemagic.yaml` `submit_to_app_store: true` setzen und zur Prüfung einreichen.

---

## Wichtige ehrliche Hinweise

- **Kosten:** Apple 99 €/Jahr (hast du), Vercel & Codemagic im kleinen Rahmen
  kostenlos, **Gemini in der Gratis-Stufe kostenlos** (bis ~1.500 Anfragen/Tag,
  10–15 pro Minute). Für Elena + ein paar Studierende reicht das locker; es
  fallen voraussichtlich gar keine KI-Kosten an.
- **App-Review:** Apple prüft KI-Apps genauer. Plane einen klaren Nutzen,
  funktionierende Inhalte und eine Datenschutzerklärung ein, sonst gibt es
  Ablehnungen. Das ist normal – nicht entmutigen lassen.
- **„Leon"-Sprüche:** Pinky stichelt bei falschen Antworten mit „Leon hätte das
  gewusst". Das ist ein privater Insider – vor einem öffentlichen Release
  überlegen, ob das für fremde Nutzer Sinn ergibt.
- Diese Anleitung ist sorgfältig erstellt, aber Apple/Codemagic/Vercel ändern
  ihre Oberflächen gelegentlich. Halte dich im Zweifel an deren aktuelle Doku.

Viel Erfolg – und sag Bescheid, wenn an einer Stelle etwas klemmt. 💜
