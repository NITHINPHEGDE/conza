# Conza Partner — Backend Setup Guide

## Backend (conza_backend/)

### 1. Install dependencies
```bash
cd conza_backend
npm install
```

### 2. Create `.env` (copy from `.env.example`)
```bash
cp .env.example .env
```
Fill in:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 3. Run
```bash
npm run dev     # development (nodemon)
npm start       # production
```

---

## REST API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/workers/signup` | ❌ | Register worker |
| POST | `/api/workers/login` | ❌ | Login |
| GET | `/api/workers/me` | ✅ | Get own profile |

### Worker
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/workers/toggle-online` | ✅ | Toggle online/offline |
| PATCH | `/api/workers/location` | ✅ | Update GPS location |
| PATCH | `/api/workers/profile-image` | ✅ | Upload profile image (multipart) |

---

## Frontend (bp_frontend/)

### New env vars needed in `.env`
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
```
- Android emulator: `http://10.0.2.2:5000/api`
- Physical device: `http://192.168.X.X:5000/api`

### New packages needed
```bash
npx expo install expo-location
```

### Files changed / added
| File | Action |
|------|--------|
| `src/services/apiClient.js` | **NEW** — base HTTP client |
| `src/services/authService.js` | **REPLACED** — now calls backend |
| `src/services/workerService.js` | **NEW** — toggle, location, image |
| `src/services/locationService.js` | **NEW** — GPS polling every 12s |
| `src/store/usePartnerStore.js` | **REPLACED** — no dummy data |
| `src/navigation/AppNavigator.js` | **UPDATED** — hydrates store on boot |
| `src/screens/auth/LoginScreen.js` | **UPDATED** — calls real API |
| `src/screens/auth/SignUpScreen.js` | **UPDATED** — calls real API |
| `src/screens/ProfileScreen.js` | **UPDATED** — uses worker fields |
| `src/screens/LabourHomeScreen.js` | **UPDATED** — uses worker fields |
| `src/data/dummyData.js` | **DELETE** (no longer used) |
| `src/utils/cloudinary.js` | **DELETE** (upload handled by backend) |

---

## Architecture Notes

### Location System
- Worker goes **Online** → `startLocationTracking()` fires
- GPS sent every **12 seconds** via `PATCH /api/workers/location`
- Backend updates same Worker document (no history)
- If no ping for `LOCATION_TIMEOUT_MS` (default 30s), worker auto-marked offline on next `GET /me`

### Auth Flow
1. Signup/Login → backend returns JWT + worker object
2. Both stored in AsyncStorage (`conza_token`, `conza_worker`)
3. App boot → reads token+worker from storage, hydrates Zustand store
4. `protect` middleware validates JWT on every protected route

### GeoJSON Index
```js
workerSchema.index({ location: '2dsphere' });
```
Enables future `$near` queries for customer-side "find nearby workers".
