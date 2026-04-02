# SASIENALA x WARDAH Guest Check-in System

A premium guest management and check-in system for the SASIENALA x WARDAH product launch event.

## Features

- **QR Code Scanning** - Fast check-in using device camera
- **Manual Search** - Search and check-in guests by name or ID
- **Real-time Stats** - Track check-in progress
- **VIP Recognition** - Special highlights for VIP guests
- **Data Export** - Export guest data to CSV
- **QR Generation** - Generate QR codes for all guests as PDF
- **Offline Support** - Works without internet connection

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open in Browser

Navigate to `http://localhost:5173`

For tablet testing, use your local IP address instead of localhost.

## How to Use

### Import Guest Data

1. Go to **Admin Panel** (tap the gear icon in bottom-right corner)
2. Click **Upload CSV**
3. Select your CSV file with guest data

**CSV Format:**
```csv
Name,Category,Email,Phone
Deny,VIP,deny@example.com,+62812345678
Sarah Wijaya,VIP,sarah@example.com,+62812345679
Budi Santoso,Regular,budi@example.com,+62812345680
```

**Categories:** VIP, Regular, Media, Speaker

### Generate QR Codes

1. Go to **Admin Panel**
2. Click **Download All QR Codes (PDF)**
3. Print and distribute to guests

### Check-in Guests

**Method 1: QR Code Scan**
1. Click **Scan QR Code** on home screen
2. Point camera at guest's QR code
3. Guest is automatically checked in

**Method 2: Manual Search**
1. Click **Search Guest** on home screen
2. Type guest name or ID
3. Tap on guest card to check-in

### Export Data

After the event, export check-in data:
1. Go to **Admin Panel**
2. Click **Export Data (CSV)**

## CSV Template

Create a file named `guests.csv`:

```csv
Name,Category,Email,Phone
Guest Name One,VIP,guest1@email.com,+6281234567890
Guest Name Two,Regular,guest2@email.com,+6281234567891
Guest Name Three,Media,guest3@email.com,+6281234567892
Guest Name Four,Speaker,guest4@email.com,+6281234567893
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Deploy

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Simple HTTP Server (for local testing)

```bash
npx serve dist
```

## Firebase Integration (Optional)

For real-time sync across multiple devices:

1. Create a Firebase project at https://console.firebase.google.com
2. Create a Firestore database
3. Copy your Firebase config
4. Create `.env` file:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Uncomment Firebase code in `src/utils/firebase.ts`

## Sound Effects (Optional)

Add sound effects for check-in feedback:

1. Place `success.mp3` in `public/sounds/`
2. Place `error.mp3` in `public/sounds/`

Recommended: Short, subtle notification sounds

## Color Scheme

- **Background:** #0D0D0D (Deep Black)
- **Accent:** #D4AF37 (Gold)
- **Text:** #F5F5F5 (Off-white)

## Browser Support

- Chrome/Edge (recommended)
- Safari
- Firefox

Camera access requires HTTPS or localhost.

## Troubleshooting

**Camera not working?**
- Make sure you're using HTTPS or localhost
- Check browser camera permissions
- Try a different browser (Chrome recommended)

**QR codes not scanning?**
- Ensure good lighting
- Hold camera steady
- Position QR code within the frame

**Data not saving?**
- Check browser localStorage is enabled
- Try clearing browser cache

## License

This project is for SASIENALA x WARDAH event use only.
