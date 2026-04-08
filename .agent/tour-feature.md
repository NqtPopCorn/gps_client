# User Stories — Audio Tour App

## 1. Actors

| Actor                       | Description                                      |
| --------------------------- | ------------------------------------------------ |
| **Guest / Tourist**         | Unauthenticated user browsing or taking tours    |
| **Registered User**         | Authenticated tourist with history & preferences |
| **Content Creator (Guide)** | Creates and publishes tours & POI content        |

---

## 2. Core User Stories (Tourist)

### 2.1 Khám phá Tour

- As a tourist, I want to **browse available tours by location** so that I can quickly find tours near me.
- As a tourist, I want to **search tours by keyword** so that I can find specific topics (history, food, culture).
- As a tourist, I want to **filter tours** by:
  - Distance
  - Duration
  - Language
  - Rating
  - Price (free / paid)

---

### 2.2 Xem Chi Tiết Tour

As a tourist, I want to **view tour details** so that I understand what I'll experience:

- List of POIs (map + order)
- Total duration
- Preview audio
- Description
- Rating / Reviews

---

### 2.3 Bắt Đầu Tour

As a tourist, I want to **start a tour** so that:

- Map shows route + POIs
- App auto-detects my location
- Nearest POI is highlighted

---

### 2.4 Auto-Play Narration ⭐ Core Value

As a tourist, I want the app to **automatically play audio when I reach a POI** so that I don't need manual interaction.

**Edge cases to handle:**

| Edge Case         | Expected Behavior                                 |
| ----------------- | ------------------------------------------------- |
| GPS drift         | Debounce location updates; avoid false triggers   |
| User skips POI    | Mark as skipped; do not auto-play on pass-through |
| User revisits POI | Prompt to replay or skip                          |

---

### 2.5 Điều Khiển Tour

As a tourist, I want to:

- ⏸ Pause / resume tour
- ⏭ Skip POI
- 🔁 Replay audio
- 📄 View transcript

---

### 2.6 Offline Mode

As a tourist, I want to **download a tour** so that I can use it without internet (PWAs).
Using: localforage, service worker

Downloaded package includes:

- [ ] Metadata (tour info, POI list, order)
- [ ] Audio files
- [ ] Map tiles _(optional)_

---

### 2.8 Thanh Toán (Paid Tours)

As a tourist, I want to:

- **Preview** selected POIs before purchase
- **Unlock full tour** after completing payment

---

### 2.9 Lịch Sử & Tracking

As a tourist, I want to:

- **Resume** an unfinished tour from where I left off
- **View** a history of completed tours

---

## 3. Offline Requirements

### Preload Assets

| Asset        | Required    |
| ------------ | ----------- |
| Audio files  | ✅ Yes      |
| POI metadata | ✅ Yes      |
| Map tiles    | ⚙️ Optional |

### Storage Strategy

| Platform | Storage Mechanism  |
| -------- | ------------------ |
| Web      | `IndexedDB`        |
| Mobile   | Native file system |
