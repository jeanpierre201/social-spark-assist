# Security Documentation

## Social Media Token Security

### Issue
Social media access tokens and refresh tokens are sensitive credentials that, if compromised, could allow attackers to hijack users' social media accounts and post malicious content.

### Security Measures Implemented

#### 1. Secure Database Functions
- **`get_social_account_tokens(account_id)`**: Securely retrieves tokens only for authenticated users accessing their own accounts
- **`update_social_account_tokens(account_id, new_access_token, new_refresh_token, new_expires_at)`**: Securely updates tokens with ownership verification

#### 2. Access Control
- All token access is restricted to account owners through user ID verification
- Functions use `SECURITY DEFINER` to ensure proper privilege escalation
- Database functions include explicit ownership checks before returning tokens

#### 3. Frontend Security
- **`useSocialTokens` hook**: Provides secure token access through RPC calls
- **`useSocialAccounts` hook**: Modified to exclude sensitive token data in normal queries
- Tokens are only accessed when absolutely necessary for API calls

#### 4. OAuth Security
- **`handle-oauth-callback` edge function**: Securely processes OAuth callbacks
- Server-side token storage prevents client-side token exposure
- Proper authentication verification before token storage

### Usage Guidelines

#### ✅ Correct Usage
```typescript
// Use the secure hook for token access
const { getTokens } = useSocialTokens();
const tokens = await getTokens(accountId);
```

#### ❌ Avoid Direct Database Access
```typescript
// DON'T do this - bypasses security measures
const { data } = await supabase
  .from('social_accounts')
  .select('access_token, refresh_token')
  .eq('id', accountId);
```

### Security Best Practices

1. **Principle of Least Privilege**: Only access tokens when making API calls
2. **Audit Trail**: All token access can be logged for security monitoring
3. **Token Rotation**: Implement regular token refresh using the secure functions
4. **Error Handling**: Never expose token values in error messages or logs

### Compliance Notes

- RLS policies ensure users can only access their own accounts
- Tokens are protected by multiple layers of access control
- Database functions provide an additional security boundary
- All token access requires valid authentication

### Monitoring and Alerts

Consider implementing:
- Failed token access attempt logging
- Unusual token usage pattern detection
- Regular security audits of token access patterns