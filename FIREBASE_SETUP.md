# Firebase Setup Instructions

## Firestore Rules Deployment

The Firestore rules have been updated to allow demo access for the Categories feature. To deploy the updated rules:

```bash
# Make sure you're logged into Firebase CLI
firebase login

# Deploy the updated rules
firebase deploy --only firestore:rules
```

## Index Creation (Optional)

The CategoryService has been updated to avoid requiring composite indexes by removing `orderBy` from queries with `where` clauses. However, if you want optimal performance, you can create the composite indexes by visiting these URLs when you encounter the index errors:

1. **Categories by userId and createdAt**: The error message will provide a direct link
2. **Categories by userId, type, and createdAt**: Another error message will provide a link

## Current Demo Setup

- **Demo User ID**: `demo-user-123`
- **Collection**: `categories`
- **Permissions**: Currently set to allow all read/write for demo purposes
- **Sorting**: Done client-side to avoid index requirements

## Production Checklist

Before going to production:

1. ✅ Update Firestore rules to require authentication
2. ✅ Replace demo user ID with actual auth user ID
3. ✅ Create composite indexes for better performance
4. ✅ Add error monitoring and logging
5. ✅ Test with real authentication flow

## Testing the Categories Page

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:3001/dashboard/category`
3. Use the Debug Panel (bottom-right) to seed demo data
4. Test CRUD operations:
   - ➕ Add new categories
   - ✏️ Edit existing categories
   - 🗑️ Delete categories
   - 🔍 Search and filter
   - 📊 View budget progress