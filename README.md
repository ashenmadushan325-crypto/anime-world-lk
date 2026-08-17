# ඇනිමි WORLD — Sri Lanka Manga (FINAL)

## Included
- Modern dark/anime-style public website
- User-facing Manga library
- Search
- Chapter reader with page images
- Admin login
- Manga + cover + chapter page upload
- Add chapters to existing Manga
- Delete Manga and uploaded files
- JSON data storage (easy to replace with a real database)
- Responsive mobile layout
- Your supplied logo

## Run locally
1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run:
   npm install
   npm start
4. Open:
   http://localhost:3000

## Admin
Default demo credentials:
Username: admin
Password: change-this-password

For a public deployment, change these environment variables:
ADMIN_USER
ADMIN_PASSWORD
SESSION_SECRET

Example:
ADMIN_USER=myadmin ADMIN_PASSWORD="strong-password" SESSION_SECRET="long-random-secret" npm start

## Important
This project is designed for Manga you created yourself or Manga you have permission/licensing to distribute. Do not upload copyrighted Manga without permission.

## Production note
This is a complete starter/deployable Node app, but for a serious public site you should add HTTPS, a persistent database, object storage/CDN, rate limiting, stronger session storage, backups, and secure environment secrets.
