# Quick Start Guide: Structural Updates

## 🚀 What's New

Three new user management pages have been added to Experta:
1. **Profile Settings** - Manage user profile
2. **Connect Accounts** - View social media connections
3. **Delete Account** - Permanently delete account

Plus a **User Menu** component for easy navigation.

---

## 📍 How to Access

### User Menu
The user menu appears in the top-right corner of:
- Dashboard page
- Onboarding page

Click your avatar to open the dropdown menu.

### Menu Options
- **Profile Settings** (⚙️) - Manage your profile
- **Connect Accounts** (🔗) - View connections
- **Delete Account** (🗑️) - Delete your account
- **Logout** (🚪) - Sign out

---

## 🔧 Profile Settings

**URL**: `/profile`

### What You Can Do
- View your email address
- Edit your display name
- See when your account was created
- Navigate to Connect Accounts
- Navigate to Delete Account

### How to Edit Name
1. Click "Edit" button next to your name
2. Type new name
3. Click "Save"
4. See success message

---

## 🔗 Connect Accounts

**URL**: `/connections`

### Current Status
OAuth integration is coming soon! This page currently shows:
- Instagram connection card (placeholder)
- LinkedIn connection card (placeholder)
- Information about OAuth security
- FAQ about connections

### What's Coming
- One-click OAuth connection
- No password sharing
- Secure token storage
- Easy disconnect option

---

## 🗑️ Delete Account

**URL**: `/delete-account`

### ⚠️ Warning
This action is **permanent** and **cannot be undone**!

### What Gets Deleted
- All your brands
- All your posts (published and scheduled)
- All your images
- All your social media connections
- All your automation logs
- All your stored credentials

### How to Delete
1. Read the warnings carefully
2. Type exactly: `DELETE MY ACCOUNT`
3. Click "Delete My Account" button
4. See deletion summary
5. Automatically logged out

### What Happens
- All data deleted from all AWS services
- Your Cognito account is disabled (for audit)
- You're logged out and redirected to login
- You can create a new account anytime

---

## 🔐 Security

### Profile Settings
- Email cannot be changed (security)
- Password change coming soon
- Two-factor authentication planned

### Delete Account
- Requires exact confirmation phrase
- Shows comprehensive warning
- Displays deletion summary
- Preserves audit trail

### Connect Accounts
- OAuth 2.0 standard (when implemented)
- No password sharing
- Minimum permissions
- Revocable anytime

---

## 🎨 UI Features

### Responsive Design
All pages work on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers

### User-Friendly
- Clear navigation
- Professional design
- Loading indicators
- Success/error messages
- Confirmation dialogs

---

## 🐛 Troubleshooting

### User Menu Not Appearing
- Make sure you're logged in
- Refresh the page
- Clear browser cache

### Can't Delete Account
- Make sure you typed exactly: `DELETE MY ACCOUNT`
- Check for typos (case-sensitive)
- Try refreshing the page

### Profile Changes Not Saving
- Check your internet connection
- Make sure you clicked "Save"
- Look for error messages

---

## 📱 Mobile Experience

### Navigation
- Tap your avatar to open menu
- Tap outside menu to close
- Swipe to scroll on long pages

### Forms
- Tap input fields to edit
- Use device keyboard
- Tap "Save" or "Cancel"

---

## 💡 Tips

### Profile Settings
- Keep your display name professional
- Update it anytime you want
- Use it to personalize your experience

### Connect Accounts
- Check back soon for OAuth
- Read the FAQ for security info
- Understand what permissions we need

### Delete Account
- Export your data first (if needed)
- Make sure you really want to delete
- Remember: this cannot be undone!

---

## 🆘 Need Help?

### Common Questions

**Q: Can I change my email?**
A: No, email is permanent for security reasons.

**Q: How do I change my password?**
A: Password change feature coming soon!

**Q: When will OAuth be available?**
A: OAuth integration is planned for Phase 3.

**Q: Can I recover a deleted account?**
A: No, deletion is permanent and cannot be undone.

**Q: What happens to my published posts?**
A: They remain on social media, but are deleted from Experta.

---

## 🚀 What's Next

### Phase 2: Intelligent Onboarding
- Natural conversation with AI
- No more token requests
- Progress indicator
- Smarter entity extraction

### Phase 3: OAuth Integration
- One-click Instagram connection
- One-click LinkedIn connection
- Secure token management
- Easy disconnect

### Phase 4: Admin Dashboard
- Platform configuration UI
- System monitoring
- Brand management
- Audit logs

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review documentation
3. Contact support
4. Check FAQ

---

## ✅ Quick Checklist

### First Time Setup
- [ ] Log in to Experta
- [ ] Complete onboarding
- [ ] Check user menu works
- [ ] Visit profile settings
- [ ] Update display name
- [ ] Check connect accounts page

### Regular Use
- [ ] Access dashboard
- [ ] Use user menu for navigation
- [ ] Update profile as needed
- [ ] Check for OAuth updates

### Before Deleting
- [ ] Export any needed data
- [ ] Understand what gets deleted
- [ ] Read all warnings
- [ ] Type confirmation exactly
- [ ] Confirm you want to proceed

---

## 🎯 Key Takeaways

1. **User Menu**: Easy access to all account features
2. **Profile Settings**: Manage your information
3. **Connect Accounts**: OAuth coming soon
4. **Delete Account**: Permanent, requires confirmation
5. **Security**: Your data is protected
6. **Mobile-Friendly**: Works on all devices

---

**Version**: 1.0.0
**Last Updated**: February 15, 2026
**Status**: Production Ready

---

Enjoy using Experta! 🎉
