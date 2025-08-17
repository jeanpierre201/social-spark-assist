# Security Documentation

## Social Media Token Security

### Issue
Social media access tokens and refresh tokens are sensitive credentials that, if compromised, could allow attackers to hijack users' social media accounts and post malicious content.

### Security Measures Implemented

#### 1. Encryption at Rest
- **`social_tokens_vault` table**: Stores encrypted tokens separately from account metadata
- **Encryption functions**: Tokens are encrypted before storage and decrypted only when needed
- **Key management**: Uses encryption key rotation with configurable key IDs

#### 2. Secure Database Functions
- **`get_social_account_tokens_encrypted(account_id)`**: Securely retrieves and decrypts tokens only for authenticated users accessing their own accounts
- **`update_social_account_tokens_encrypted(account_id, new_access_token, new_refresh_token, new_expires_at)`**: Encrypts and securely stores tokens with ownership verification
- **Backward compatibility aliases**: Maintains existing API while adding encryption layer

#### 3. Access Control
- All token access is restricted to account owners through user ID verification
- Functions use `SECURITY DEFINER` to ensure proper privilege escalation
- Database functions include explicit ownership checks before returning tokens
- **Vault isolation**: Encrypted tokens stored in separate vault table with no direct access policies

#### 4. Frontend Security
- **`useSocialTokens` hook**: Provides secure token access through RPC calls
- **`useSocialAccounts` hook**: Modified to exclude sensitive token data in normal queries
- Tokens are only accessed when absolutely necessary for API calls

#### 5. OAuth Security
- **`handle-oauth-callback` edge function**: Securely processes OAuth callbacks
- Server-side token storage prevents client-side token exposure
- Proper authentication verification before token storage
- **Automatic encryption**: OAuth callback automatically encrypts tokens upon storage

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
2. **Encryption at Rest**: All tokens are encrypted before storage in the vault
3. **Audit Trail**: All token access can be logged for security monitoring
4. **Token Rotation**: Implement regular token refresh using the secure functions
5. **Error Handling**: Never expose token values in error messages or logs
6. **Key Management**: Use proper encryption key rotation and management

### Compliance Notes

- **Encryption at Rest**: Tokens are encrypted and stored in a secure vault
- **RLS policies**: Ensure users can only access their own accounts
- **Multiple security layers**: Access control, encryption, and secure functions
- **Database isolation**: Vault table completely isolated with no direct access
- **Audit capabilities**: All token access can be monitored and logged
- **Key management**: Supports encryption key rotation for enhanced security

### Monitoring and Alerts

Consider implementing:
- Failed token access attempt logging
- Unusual token usage pattern detection
- Regular security audits of token access patterns