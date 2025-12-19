# Mobile Camera Access Fix Guide

## The Problem

When accessing the website on mobile devices via HTTP (like `http://192.168.x.x:5173`), the camera cannot be accessed because modern browsers require HTTPS for camera permissions.

## Why This Happens

- **Security Requirement**: Browsers only allow camera access on secure contexts (HTTPS or localhost)
- **HTTP Restriction**: Regular HTTP connections are considered insecure
- **Mobile Browsers**: Stricter than desktop browsers about security requirements

## Solutions

### Solution 1: Use localhost (Easy for Testing)

If testing on the same device running the server:

```bash
# Access via localhost on mobile browser
http://localhost:5173
```

### Solution 2: Use ngrok (Recommended for Mobile Testing)

#### Step 1: Install ngrok

```bash
# macOS
brew install ngrok

# Windows/Linux
# Download from https://ngrok.com/download
```

#### Step 2: Start your dev server

```bash
npm run dev
```

#### Step 3: Create secure tunnel with ngrok

```bash
ngrok http 5173
```

#### Step 4: Use the HTTPS URL

You'll get a URL like:

```
https://xxxx-xxxx-xxxx.ngrok-free.app
```

Access this URL on your mobile device - camera will work!

### Solution 3: Create Self-Signed Certificate (Advanced)

#### Step 1: Create certificates directory

```bash
mkdir certs
cd certs
```

#### Step 2: Generate self-signed certificate

```bash
# macOS/Linux
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

#### Step 3: Trust the certificate on your device

- **iOS**: Email the cert.pem to yourself, open it, and install the profile
- **Android**: Copy cert.pem to device, go to Settings > Security > Install certificates

#### Step 4: Start dev server with HTTPS

```bash
npm run dev
```

The server will automatically use HTTPS if certificates exist in the certs folder.

#### Step 5: Access via HTTPS

```
https://192.168.x.x:5173
```

### Solution 4: Deploy to a Real HTTPS Server

Deploy your app to any HTTPS-enabled hosting:

- Vercel: `vercel deploy`
- Netlify: `netlify deploy`
- GitHub Pages (with custom domain + HTTPS)
- Any web server with SSL certificate

## Quick Troubleshooting

### Error: "Camera access requires HTTPS"

- **Solution**: Use one of the HTTPS methods above
- **Quick Fix**: Use ngrok for instant HTTPS

### Error: "Camera access denied"

- **Solution**:
  1. Check browser permissions (Settings > Site Settings > Camera)
  2. Clear browser cache and cookies
  3. Restart browser
  4. Try different browser (Chrome/Safari)

### Error: "No camera found"

- **Solution**:
  1. Check if other apps can access camera
  2. Restart device
  3. Check camera permissions for browser app

### Error: "Camera is busy"

- **Solution**:
  1. Close other apps using camera
  2. Restart browser
  3. Restart device

## Testing Checklist

1. **Check HTTPS Context**:

   ```javascript
   console.log("Is Secure Context:", window.isSecureContext);
   // Should return true
   ```

2. **Check Camera API**:

   ```javascript
   console.log(
     "Camera API available:",
     !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
   );
   // Should return true
   ```

3. **Test Camera Access**:
   ```javascript
   navigator.mediaDevices
     .getUserMedia({ video: true })
     .then((stream) => {
       console.log("Camera works!");
       stream.getTracks().forEach((track) => track.stop());
     })
     .catch((err) => console.error("Camera error:", err));
   ```

## Recommended Setup for Development

1. **Local Development**: Use localhost
2. **Testing on Same Network**: Use ngrok
3. **Team Testing**: Deploy to Vercel/Netlify
4. **Production**: Use proper SSL certificate

## Mobile Browser Compatibility

| Browser | iOS | Android | Notes              |
| ------- | --- | ------- | ------------------ |
| Safari  | ✅  | -       | Requires iOS 14.3+ |
| Chrome  | ✅  | ✅      | Best support       |
| Firefox | ✅  | ✅      | Good support       |
| Edge    | ✅  | ✅      | Good support       |
| Opera   | ⚠️  | ⚠️      | Limited support    |

## Additional Tips

1. **Always test on real devices** - Emulators may not properly simulate camera
2. **Use Chrome DevTools** - Remote debugging for Android
3. **Use Safari Web Inspector** - For iOS debugging
4. **Check browser console** - Most errors are logged there
5. **Update browsers** - Ensure latest version for best support

## Common Commands

```bash
# Start dev server with network access
npm run dev

# Start ngrok tunnel
ngrok http 5173

# Check your IP address
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig | findstr IPv4
```

## Need Help?

1. Check browser console for errors
2. Verify HTTPS/secure context
3. Test with ngrok first
4. Try different browser
5. Check camera permissions in device settings
