#!/bin/bash

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=AIDC/CN=localhost"

echo "✅ Self-signed certificates generated in ./certs directory"
echo ""
echo "To use HTTPS:"
echo "1. Run: npm run dev"
echo "2. Access: https://localhost:5173 or https://YOUR_IP:5173"
echo ""
echo "Note: You'll need to accept the certificate warning in your browser"
echo ""
echo "For mobile devices:"
echo "- iOS: Email cert.pem to yourself and install it"
echo "- Android: Copy cert.pem to device and install via Settings > Security"
