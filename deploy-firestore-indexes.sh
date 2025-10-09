#!/bin/bash

echo "🔥 Deploying Firestore Indexes..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase."
    echo "Login with: firebase login"
    exit 1
fi

echo "📋 Current Firestore indexes configuration:"
cat firestore.indexes.json | jq '.'

echo ""
echo "🚀 Deploying indexes to Firestore..."

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore indexes deployed successfully!"
    echo ""
    echo "📝 Indexes created for:"
    echo "   - user_subscriptions (userId + status + createdAt)"
    echo "   - user_subscriptions (userId + createdAt)"
    echo "   - payment_details (userId + createdAt)"
    echo "   - active_user_subscriptions (userId + status)"
    echo ""
    echo "🎉 You can now use complex queries without index errors!"
else
    echo ""
    echo "❌ Failed to deploy Firestore indexes."
    echo "Check your Firebase configuration and try again."
    exit 1
fi