# Flutter WebView Integration Guide

This guide explains how to integrate the Superwork Check-in web application into a Flutter app using WebView.

## Prerequisites

- Flutter SDK installed
- Android Studio / Xcode for mobile development
- Basic knowledge of Flutter and WebView

---

## Step 1: Add WebView Dependencies

### pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  webview_flutter: ^4.4.2
  permission_handler: ^11.0.1
```

Run:

```bash
flutter pub get
```

---

## Step 2: Configure Permissions

### Android (android/app/src/main/AndroidManifest.xml)

Add camera and location permissions:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Camera permission for QR code scanning -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- Location permission for check-in -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Internet permission -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:usesCleartextTraffic="true"
        ...>
        ...
    </application>
</manifest>
```

### iOS (ios/Runner/Info.plist)

Add camera and location permissions:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan QR codes for check-in</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to record check-in location</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs location access to record check-in location</string>
```

---

## Step 3: Create WebView Widget

### lib/webview_page.dart

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';

class WebViewPage extends StatefulWidget {
  final String url;
  final String? token;

  const WebViewPage({
    Key? key,
    required this.url,
    this.token,
  }) : super(key: key);

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
    _initializeWebView();
  }

  Future<void> _requestPermissions() async {
    // Request camera permission
    var cameraStatus = await Permission.camera.status;
    if (!cameraStatus.isGranted) {
      cameraStatus = await Permission.camera.request();
      if (cameraStatus.isDenied) {
        _showPermissionDialog('Camera');
      }
    }

    // Request location permission
    var locationStatus = await Permission.location.status;
    if (!locationStatus.isGranted) {
      locationStatus = await Permission.location.request();
      if (locationStatus.isDenied) {
        _showPermissionDialog('Location');
      }
    }
  }

  void _showPermissionDialog(String permission) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Permission Required'),
          content: Text('Please grant $permission permission in app settings to use this feature.'),
          actions: [
            TextButton(
              onPressed: () {
                openAppSettings();
                Navigator.of(context).pop();
              },
              child: const Text('Open Settings'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  void _initializeWebView() {
    final String url = widget.token != null
        ? '${widget.url}?token=${widget.token}'
        : widget.url;

    // Set user agent to identify as WebView
    String userAgent = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
    if (Platform.isIOS) {
      userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
    }

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setUserAgent(userAgent)
      ..enableZoom(true)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            // Inject script to detect WebView
            _controller.runJavaScript('''
              if (typeof window.flutter_inappwebview !== 'undefined') {
                document.body.setAttribute('data-webview', 'flutter');
              }
            ''');
          },
          onWebResourceError: (WebResourceError error) {
            print('WebView error: ${error.description}');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Error loading page: ${error.description}'),
                backgroundColor: Colors.red,
              ),
            );
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: (JavaScriptMessage message) {
          // Handle messages from web app if needed
          print('Message from web: ${message.message}');
        },
      )
      ..loadRequest(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Superwork Check-in'),
        backgroundColor: const Color(0xFF3B82F6),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _controller.reload();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
```

---

## Step 4: Configure WebView Settings

### Android WebView Configuration

For better camera support, you may need to configure WebView settings:

```dart
_controller = WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..setBackgroundColor(Colors.white)
  ..enableZoom(true)
  ..setUserAgent('Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36')
  ..addJavaScriptChannel(
    'FlutterChannel',
    onMessageReceived: (JavaScriptMessage message) {
      // Handle messages
    },
  );
```

---

## Step 5: Handle Permissions in Flutter

### Request Permissions Before Opening WebView

```dart
Future<void> _checkAndRequestPermissions() async {
  // Check camera permission
  var cameraStatus = await Permission.camera.status;
  if (!cameraStatus.isGranted) {
    cameraStatus = await Permission.camera.request();
    if (cameraStatus.isDenied) {
      // Show dialog to user
      _showPermissionDialog('Camera');
      return;
    }
  }

  // Check location permission
  var locationStatus = await Permission.location.status;
  if (!locationStatus.isGranted) {
    locationStatus = await Permission.location.request();
    if (locationStatus.isDenied) {
      // Show dialog to user
      _showPermissionDialog('Location');
      return;
    }
  }
}

void _showPermissionDialog(String permission) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        title: Text('Permission Required'),
        content: Text('Please grant $permission permission in app settings'),
        actions: [
          TextButton(
            onPressed: () => openAppSettings(),
            child: Text('Open Settings'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel'),
          ),
        ],
      );
    },
  );
}
```

---

## Step 6: Usage Example

### lib/main.dart

```dart
import 'package:flutter/material.dart';
import 'webview_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Superwork Check-in',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Superwork Check-in'),
      ),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => WebViewPage(
                  url: 'https://your-web-app-url.com',
                  token: 'your-token-here', // Optional
                ),
              ),
            );
          },
          child: const Text('Open Check-in'),
        ),
      ),
    );
  }
}
```

---

## Step 7: Important WebView Settings

### Enable Camera and Location in WebView

Make sure your WebView allows:

- JavaScript (required)
- Camera access
- Location access
- File access (if needed)

### Android WebView Settings

```dart
_controller = WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..enableZoom(true)
  ..setBackgroundColor(Colors.white);
```

### iOS WebView Settings

iOS WebView automatically respects Info.plist permissions.

---

## Step 8: Testing

### Test Checklist

1. ✅ Camera permission is requested
2. ✅ Location permission is requested
3. ✅ QR code scanner opens camera
4. ✅ Check-in works with location
5. ✅ WebView loads correctly
6. ✅ JavaScript is enabled
7. ✅ Navigation works

---

## Troubleshooting

### Camera Not Working

**Problem:** Camera doesn't open in WebView

**Solutions:**

1. Check if camera permission is granted in app settings
2. Verify AndroidManifest.xml / Info.plist has camera permission
3. Make sure WebView JavaScript is enabled
4. Check if another app is using the camera

### Location Not Working

**Problem:** Location is not detected

**Solutions:**

1. Check if location permission is granted
2. Verify location services are enabled on device
3. Check AndroidManifest.xml / Info.plist has location permission
4. Test on real device (not emulator)

### WebView Not Loading

**Problem:** WebView shows blank page

**Solutions:**

1. Check internet connection
2. Verify URL is correct
3. Check if JavaScript is enabled
4. Check console for errors
5. Verify CORS settings on server

---

## Best Practices

1. **Request Permissions Early**: Request camera and location permissions before opening WebView
2. **Handle Permission Denials**: Show user-friendly messages when permissions are denied
3. **Test on Real Devices**: Always test camera and location features on real devices
4. **Error Handling**: Implement proper error handling for WebView errors
5. **Loading States**: Show loading indicators while WebView is loading

---

## Additional Resources

- [webview_flutter package](https://pub.dev/packages/webview_flutter)
- [permission_handler package](https://pub.dev/packages/permission_handler)
- [Flutter WebView Documentation](https://docs.flutter.dev/development/platform-integration/webviews)

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify all permissions are granted
3. Test on different devices
4. Check Flutter and package versions
