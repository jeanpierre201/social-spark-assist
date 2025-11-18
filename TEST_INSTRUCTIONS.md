# 50-User Testing Instructions for SocialNova

## Overview
This document provides comprehensive instructions for testing the SocialNova platform with 50 free plan users, including account creation, content generation, and profile management.

## Prerequisites

### 1. Disable Email Confirmation (Important!)
To speed up testing, disable email confirmation in Supabase:

1. Go to [Supabase Authentication Settings](https://supabase.com/dashboard/project/bmkwrzrcefgoqsgiorek/auth/settings)
2. Scroll to "Email Confirmation"
3. Disable "Confirm email" option
4. This allows immediate login without email verification

### 2. Check Rate Limits
- Supabase has authentication rate limits
- The test utility creates users in batches of 5 with delays to avoid hitting limits
- If you encounter rate limit errors, increase the delay between batches

## Testing Methods

### Option 1: Automated Testing (Recommended)

#### Using the Test Utility Page

1. **Access the Test Utility:**
   - Navigate to `/test-utility` in your browser
   - Or visit: `https://your-app-url.lovableproject.com/test-utility`

2. **Configure Test:**
   - Set "Number of Test Users" to `50`
   - Click "Start Test"

3. **What the Automated Test Does:**
   - ✅ Creates 50 user accounts (testuser1@socialnova.test through testuser50@socialnova.test)
   - ✅ Each user gets password: TestPass{N}123! (where N is the user number)
   - ✅ For each user:
     - Logs in
     - Generates social media content
     - Updates profile name
     - Changes password to NewPass{N}123!
     - Logs out
   - ✅ Displays real-time progress
   - ✅ Shows detailed results log
   - ✅ Provides summary statistics

4. **Monitor Progress:**
   - Watch the progress bar
   - Review the results log as operations complete
   - Check the summary when complete

5. **Expected Results:**
   - All 50 users should be created successfully
   - Each user should have 1 post visible for 24 hours
   - All profile updates should succeed
   - All password changes should succeed

### Option 2: Manual Testing

If you prefer to test manually or want to verify specific scenarios:

#### Step 1: Create Test Accounts

Use the browser console to create accounts:

```javascript
// Open browser console (F12)
// Import the utilities
import { generateTestUsers, createTestUsersBatch } from '@/utils/testUtils';

// Generate 50 test users
const users = generateTestUsers(50);

// Create accounts (in batches to avoid rate limits)
const results = await createTestUsersBatch(users, 5);

// Check results
console.log('Created:', results.filter(r => r.success).length);
console.log('Failed:', results.filter(r => !r.success).length);
```

#### Step 2: Test Individual User Workflow

For each test user (you can sample a few):

1. **Login:**
   - Email: `testuser1@socialnova.test`
   - Password: `TestPass1123!`

2. **Generate Content:**
   - Navigate to `/content-generator`
   - Fill in:
     - Industry: Any (e.g., "Technology")
     - Goal: Any (e.g., "Promote new product")
   - Click "Generate Content"
   - Verify content is displayed

3. **View Generated Content:**
   - Content should appear in the posts list
   - Note: Free users see posts for 24 hours only
   - Banner should indicate 24-hour retention

4. **Update Profile:**
   - Navigate to `/profile`
   - Change name to "Updated Test User 1"
   - Upload a profile picture (optional)
   - Click "Save Changes"
   - Verify success message

5. **Change Password:**
   - Stay on `/profile`
   - Scroll to "Change Password"
   - Current password: `TestPass1123!`
   - New password: `NewPass1123!`
   - Confirm password: `NewPass1123!`
   - Click "Change Password"
   - Verify success message

6. **Logout and Re-login:**
   - Logout
   - Login with new password: `NewPass1123!`
   - Verify login succeeds

7. **Verify 24-Hour Content Retention:**
   - Check that the post is still visible
   - Return after 24 hours to verify post is no longer shown

## Test Accounts Information

After running the automated test, you'll have these accounts:

| User # | Email | Initial Password | Updated Password |
|--------|-------|-----------------|------------------|
| 1 | testuser1@socialnova.test | TestPass1123! | NewPass1123! |
| 2 | testuser2@socialnova.test | TestPass2123! | NewPass2123! |
| ... | ... | ... | ... |
| 50 | testuser50@socialnova.test | TestPass50123! | NewPass50123! |

## Verification Checklist

Use this checklist to verify all functionality works:

### Account Creation ✓
- [ ] All 50 accounts created successfully
- [ ] No duplicate email errors
- [ ] Users can login immediately (email confirmation disabled)

### Content Generation ✓
- [ ] Each user can generate content
- [ ] Content includes caption and hashtags
- [ ] Monthly usage counter increments
- [ ] Free users limited to 1 post per month

### Content Visibility ✓
- [ ] Generated content is visible immediately
- [ ] Posts show for 24 hours
- [ ] Info banner displays for free users
- [ ] Posts are saved in database

### Profile Management ✓
- [ ] Users can update their name
- [ ] Users can upload profile pictures
- [ ] Users can delete profile pictures
- [ ] Changes persist after logout/login

### Password Management ✓
- [ ] Users can change their password
- [ ] Old password validation works
- [ ] New password must be 6+ characters
- [ ] Password confirmation matching works
- [ ] Can login with new password

### 24-Hour Retention ✓
- [ ] Posts visible for free users for 24 hours
- [ ] After 24 hours, posts are hidden (filtered from query)
- [ ] Paid users see all posts permanently

## Database Verification

### Check Users Created:
```sql
SELECT COUNT(*) 
FROM auth.users 
WHERE email LIKE 'testuser%@socialnova.test';
```

### Check Posts Created:
```sql
SELECT COUNT(*) 
FROM posts 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE 'testuser%@socialnova.test'
);
```

### Check Monthly Usage:
```sql
SELECT user_id, posts_created 
FROM monthly_usage 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE 'testuser%@socialnova.test'
);
```

### Check Free User Posts (24-hour filter):
```sql
SELECT p.*, u.email 
FROM posts p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'testuser%@socialnova.test'
  AND p.created_at > NOW() - INTERVAL '24 hours';
```

## Cleanup (After Testing)

To remove test users and their data:

```sql
-- Delete posts from test users
DELETE FROM posts 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE 'testuser%@socialnova.test'
);

-- Delete monthly usage
DELETE FROM monthly_usage 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE 'testuser%@socialnova.test'
);

-- Delete profiles
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE 'testuser%@socialnova.test'
);

-- Delete auth users (will cascade to other tables)
-- Note: This must be done via Supabase Dashboard > Authentication > Users
-- Or use Supabase Admin API
```

## Troubleshooting

### Rate Limit Errors
- **Problem:** "Too many requests" errors during user creation
- **Solution:** Increase delay between batches in `createTestUsersBatch` function

### Email Confirmation Required
- **Problem:** Users can't login immediately after signup
- **Solution:** Disable email confirmation in Supabase Auth settings

### Content Generation Fails
- **Problem:** "Failed to generate content" errors
- **Solution:** Check that LOVABLE_API_KEY or OPENAI_API_KEY is configured in Supabase secrets

### Posts Not Visible
- **Problem:** Generated posts don't appear
- **Solution:** Check RLS policies on posts table allow users to view their own posts

### Password Change Fails
- **Problem:** "Failed to update password" error
- **Solution:** Ensure user is logged in and new password meets requirements (6+ characters)

## Expected Performance

- **User Creation:** ~2-3 minutes for 50 users (with rate limit delays)
- **Content Generation:** ~1-2 seconds per user
- **Profile Updates:** <1 second per user
- **Total Test Time:** ~10-15 minutes for complete automated test

## Success Criteria

✅ All 50 users created successfully  
✅ 50 posts generated (1 per user)  
✅ 50 profiles updated  
✅ 50 passwords changed  
✅ All users can login with new credentials  
✅ Content visible for 24 hours  
✅ No errors in console or results log  

## Next Steps

After successful testing:
1. Review the test summary statistics
2. Check database for data integrity
3. Verify 24-hour content retention after waiting period
4. Test paid plan upgrade flow with sample test users
5. Run performance tests with larger user counts if needed

## Support

If you encounter issues during testing:
- Check the console logs for detailed error messages
- Review the results log in the Test Utility page
- Verify Supabase configuration and secrets
- Check RLS policies are correctly configured
