

# Plan: Authentication Emails with Custom SMTP, Forgot Password, and Manager Role

## Overview

This plan implements three key features:
1. Custom SMTP for authentication emails (email confirmation, password reset)
2. Forgot password functionality on the login page
3. A new "manager" role with restricted admin access (no email settings, no user management)

---

## 1. Database Changes

### Add "manager" to the app_role Enum

The current `app_role` enum only has `admin` and `user`. We need to add `manager`:

```sql
ALTER TYPE public.app_role ADD VALUE 'manager';
```

---

## 2. Edge Function: Custom Auth Emails

### Create `send-auth-email` Function

This function will handle sending authentication-related emails using the SMTP configuration from the admin panel:

- **Email Verification**: When a user signs up
- **Password Reset**: When a user requests a password reset
- **Magic Link** (optional): For passwordless login

The function will:
1. Accept email type, recipient, and token/link data
2. Fetch SMTP settings from `email_settings` table
3. Send branded HTML emails using the configured SMTP server
4. Log all attempts to `email_logs` table

---

## 3. Password Reset Flow

### Frontend Changes

**Auth Page Updates:**
- Add "Forgot password?" link below the password field (visible in sign-in mode)
- Create a "forgot password" mode that shows only email input
- Add "Reset password" mode for setting new password after clicking email link

**New Password Reset Page:**
- Handle the password reset token from email link
- Allow users to set a new password
- Validate password requirements

### Backend Flow

```text
+------------------+     +--------------------+     +------------------+
|   User clicks    | --> | Edge function      | --> | Email sent via   |
|   "Forgot pwd"   |     | generates token    |     | custom SMTP      |
+------------------+     +--------------------+     +------------------+
                                  |
                                  v
+------------------+     +--------------------+     +------------------+
|   User sets      | <-- | User clicks link   | <-- | User receives    |
|   new password   |     | in email           |     | reset email      |
+------------------+     +--------------------+     +------------------+
```

---

## 4. Manager Role Implementation

### Access Control Matrix

| Feature | Admin | Manager |
|---------|-------|---------|
| Orders | Yes | Yes |
| Products | Yes | Yes |
| Inventory | Yes | Yes |
| Coupons | Yes | Yes |
| Setups | Yes | Yes |
| Categories | Yes | Yes |
| Brands | Yes | Yes |
| Email Settings | Yes | **No** |
| User Management | Yes | **No** |

### Frontend Changes

**Admin Page:**
- Update role check to allow both `admin` and `manager`
- Conditionally hide the "Email" tab for managers
- Add visual indicator for manager vs admin access

### Backend Changes

**Edge Functions:**
- Update `admin-send-email` to require `admin` role only (already does this)
- Update other admin functions to accept both `admin` and `manager` roles:
  - `admin-get-orders`
  - `admin-manage-coupons`
  - `admin-manage-products`
  - `admin-manage-setups`
  - `admin-refund-order`
  - `admin-update-inventory`
  - `send-order-notification`

---

## 5. Admin Panel: User Management (for granting manager role)

### New Admin Tab: Users

Create an admin interface to:
- List all users with their roles
- Assign/remove the `manager` role from users
- View user details (email, signup date)

Note: Only admins can access this tab (not managers).

---

## Technical Implementation Details

### Files to Create

1. `supabase/functions/send-auth-email/index.ts` - Custom SMTP auth email handler
2. `src/pages/ResetPassword.tsx` - Password reset page (for setting new password)
3. `src/components/admin/AdminUsers.tsx` - User management component

### Files to Modify

1. `src/pages/Auth.tsx` - Add forgot password link and flow
2. `src/context/AuthContext.tsx` - Add `resetPassword` and `updatePassword` methods
3. `src/pages/Admin.tsx` - Add role-based tab visibility, add Users tab
4. `supabase/functions/*/index.ts` - Update role checks to include manager
5. `supabase/config.toml` - Register new edge function

### Database Migration

```sql
-- Add manager role to enum
ALTER TYPE public.app_role ADD VALUE 'manager';
```

---

## Implementation Sequence

1. **Database** - Add manager role to enum
2. **Auth Context** - Add password reset methods
3. **Auth Page** - Add forgot password UI and flow
4. **Reset Password Page** - Create new page for password confirmation
5. **Send Auth Email Function** - Create edge function for custom SMTP auth emails
6. **Update Edge Functions** - Allow manager role access
7. **Admin Users Tab** - Create user management interface
8. **Admin Page** - Add role-based tab visibility

---

## Security Considerations

- Password reset tokens expire after 1 hour
- Rate limiting on password reset requests (1 per minute per email)
- Manager role cannot escalate to admin
- Only admins can manage user roles
- All auth emails logged for audit trail

