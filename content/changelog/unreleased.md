---
title: Unreleased
authors:
  - anhthang
  - name: Claude
    icon: simple-icons:claude
    color: '#D97757'
    to: https://claude.com/claude-code
---

**Boost the signal** — Keebdex now tells you when your submissions are reviewed, your feedback is resolved, or there is news worth knowing. This release adds notifications and announcements, brings the wishlist builder to your phone with a new Save & Share window, turns keyset pages into a proper catalog, and makes every grid load faster with images sized for your screen.

### ✨ What's New

- **Notifications**: get notified when your submissions are approved, rejected, or deleted (with the moderator's note), when your feedback is resolved, and when your role changes. Moderators hear when a submission they rejected is resubmitted, and bulk reviews arrive as one notification. Choose what you hear about in the new **Notification settings** in Account Settings.
- **Announcements**: Keebdex news has its own _Announcements_ tab under Notifications and counts toward the sidebar badge. The top three also show as toasts when you open the site; dismiss one or mark it as read and its toast stays gone on every device once you sign in. Announcement toasts can be turned off in Notification settings.
- A new **colorway search page**, opened from _View all_ in the search palette, updates as you type and offers exact-term matching, grouping by maker, and _Save to Collection_.
- The **Wishlist Image** builder now works on phones: edit in a two-column view (press and hold to drag), and the image keeps your column count on every device.
- A new **Save & Share** window previews your wishlist image to copy, download, or share from your phone, and gives the trading list as text (Discord/Reddit formatting or plain) ready to copy.

### 🐛 Bug Fixes

- Colorway cards on narrow phones no longer stretch their photo past the card edge; extra action buttons wrap onto a second line.
- Trading wishlists no longer let a card be dragged between the Want and Have lists, which left it impossible to remove.
- Sidebar items no longer sometimes show another item's icon and color after loading the page signed in.
- Keyset pages with no kits now still show the set's details instead of an empty page.
- Paging past the last page of a keyset list now shows an empty page instead of a server error.
- Keyset profile pages no longer show _Not Found_ when opened directly, and their title now names the manufacturer and profile (e.g. _GMK CYL Keysets_).
- Shared collections no longer show _Share_, _Edit_, _Delete_, _Manual Sort_, or item actions to visitors; only the owner sees them.
- _My Collection_ artisan collections no longer grey out caps as if they were sold, or offer listing details and prices.

### 🚀 Improvements

- Artisan, keyset, and keyboard grids now load images sized for your screen instead of full-size photos, so pages load faster, especially on phones.
- Error, success, and info colors now match each theme's palette instead of bright defaults.
- Empty pages now show an icon and friendlier copy.
- The search palette lists artisan colorways in one list, closest name matches first, matching every word you type in the colorway's own name and hiding deleted colorways; makers and sculpts keep their own groups.
- **About** and **Changelog** moved from the sidebar into the profile menu.
- The **Keysets** section now leads with a catalog of manufacturers grouped by profile. Group buy stages share one _Group Buys_ page with Interest Check / Live / Ended tabs (old `/keyset?status=…` links redirect), and _Color Swatches_ is now _Colors_.
- **Keyset pages** now read like a catalog entry: a fixed cover instead of a carousel, set details apart from group buy history, Geekhack and order links beside the title, a full-width color palette, a _Save_ button, and a grid of kits (with price and unit count) you can click to enlarge.
- The _Save_ button is now available to every signed-in user, with a _New Collection_ option to start a collection right from the item.
- Dark logos now invert reliably in dark mode, including when the color mode follows the system setting.
- Copied and downloaded images (wishlists, colorway, trading, and keyboard cards) now have the same size on every device, are sharper on high-resolution screens, and copy in Safari too.
- The wishlist builder now guides first steps: empty wishlists point you to the settings, a tip shows how to reorder cards, and buying lists no longer show an empty _Preferences_ section.
- The signed-out **Wishlist Image** and **My Collection** pages now show what you can do there before you sign in.
- Signed-in feedback no longer asks for your name and email.
- **Colorway cards** share one holographic foil that sweeps across and then rests, so the artwork stays clear; hover to hide it. It stays still when your device asks for reduced motion.
- The **collection form** now explains each kind of collection: _My Collection_, _Wishlist_, or _For Sale or Trade_. Your Discord username fills in from your profile, and wishlist and for-sale collections note that sharing them publicly lists them in the _Trading Hub_. Item switches now read _Still Looking_ and _Available_.
- The marketplace page is now titled **Trading Hub**, like the sidebar, and explains how to get listed.
