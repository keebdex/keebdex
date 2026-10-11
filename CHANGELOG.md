# Changelog

## [Unreleased]

### ✨ What's New

- **Notifications**: get notified when your submissions are approved, rejected, or deleted (with the moderator's note), when your feedback is resolved, and when your role changes. Moderators hear when a submission they rejected is resubmitted, and bulk reviews arrive as one notification. Find them under _Notifications_ in the sidebar.
- Feedback sent while signed in no longer asks for your name and email.
- **Notification settings** in Account Settings let you choose what you are notified about.
- **Announcements**: Keebdex news now has its own _Announcements_ tab under Notifications, and new announcements count toward the Notifications badge in the sidebar. The top three also show as toasts when you open the site (with a link to the rest). Dismiss one or mark it as read and it stays hidden on every device once you sign in. You can turn announcement toasts off in Notification settings.
- Searches with many artisan colorway matches now offer a _View all_ link to a new **colorway search page** that updates as you type, with exact-term matching, grouping by maker, and _Save to Collection_.
- The **Wishlist Image** builder now works on phones: edit in a two-column view (press and hold to drag), and the image keeps the column count from your settings on every device.
- A new **Save & Share** window previews your wishlist image to copy, download, or share from your phone, and shows the trading list as text, in Discord/Reddit formatting or plain text, ready to copy.

### 🐛 Bug Fixes

- Trading wishlists no longer let a card be dragged between the Want and Have lists, which left it impossible to remove.
- Sidebar items no longer sometimes show another item's icon and color after loading the page signed in.
- Keyset pages with no kits now still show the set's details instead of an empty page.
- Paging past the last page of a keyset list now shows an empty page instead of a server error.
- Keyset profile pages no longer show _Not Found_ when opened directly, and their title now names the manufacturer and profile (e.g. _GMK CYL Keysets_).

### 🚀 Improvements

- Error, success, and info colors now match each theme's palette instead of bright defaults.
- Empty pages now show an icon and friendlier copy.
- Artisan colorways in the search palette are now a single list with the closest name matches first, instead of nested groups by maker.
- Colorway search now matches the colorway's own name (every word you type) and hides deleted colorways; makers and sculpts keep their own result groups.
- **About** and **Changelog** moved from the sidebar into the profile menu.
- The **Keysets** sidebar now leads with the catalog: the Keysets home (`/keyset`) is now a catalog of manufacturers grouped by profile, group buy stages share one _Group Buys_ page with Interest Check / Live / Ended tabs, and _Color Swatches_ is now _Colors_. Old `/keyset?status=…` links redirect to the matching tab.
- **Keyset pages** now read like a catalog entry: a fixed cover instead of an autoplay carousel, set details kept apart from group buy history, Geekhack / Order Graph / Order History icon links beside the title, a grid of kits you can click to enlarge, a full-width color palette, and a _Save_ button. Each kit card shows its group buy price beside the name and its unit count below it, and sets without a usable cover image spread their details across the page instead.
- The _Save_ button is now available to every signed-in user, with a _New Collection_ option (its category fixed to the item's) to start a collection right from the item.
- Dark logos now invert reliably in dark mode, including when the color mode follows the system setting.
- Copied and downloaded images (wishlists, colorway cards, artisan trading cards, keyboard cards) now have the same size on every device instead of following the screen width, are sharper on high-resolution screens, and copy in Safari too.
- The wishlist builder now guides first steps: empty wishlists point you to the settings, a tip shows how to reorder cards, and buying lists no longer show an empty _Preferences_ section.
- The signed-out **Wishlist Image** and **My Collection** pages now show what you can do there before you sign in.
