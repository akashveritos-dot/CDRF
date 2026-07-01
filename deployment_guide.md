# VPS Deployment Guide (Next.js Standalone with PM2)

Because your local development code and the VPS both connect to the same remote database (`82.112.239.206`), **all database migrations and seeding are already live**. 

You only need to deploy the code updates (files and configuration changes) to your server and restart the Node.js PM2 process.

Choose **Method A** (e.g. Git) if your project uses GitHub/GitLab, or **Method B** (manual zip/SFTP transfer) otherwise.

---

## Method A: Git Deployment (Recommended)

If your project is connected to a remote Git repository:

### 1. On your Local Machine
Commit and push the changes:
```bash
git add .
git commit -m "Fix dynamic forms, image uploads, and conclave capitalization"
git push origin main
```

### 2. On your VPS (via SSH)
1. SSH into your server:
   ```bash
   ssh username@vps-ip-address
   ```
2. Navigate to your project directory:
   ```bash
   cd /home/path-to-your-dcrs-project
   ```
3. Pull the latest code:
   ```bash
   git pull origin main
   ```
4. Install any new dependencies:
   ```bash
   npm install
   ```
5. Compile the production standalone build:
   ```bash
   npm run build
   ```
6. Restart the PM2 process to apply changes:
   ```bash
   pm2 restart all
   # Or restart by process name/id:
   # pm2 restart dcrs-app
   ```

---

## Method B: Manual SFTP/SCP Zip Upload (Fallback)

If you do not use Git, you can copy the built standalone files directly:

### 1. On your Local Machine
1. Run the build to generate the `.next/standalone` folder locally:
   ```bash
   npm run build
   ```
2. Use an SFTP client (like **FileZilla**, **WinSCP**, or VS Code SFTP extension) to connect to your VPS.
3. Upload the following files/folders from your local project root into the VPS project directory:
   - `.next/standalone/` (replaces files in the server folder)
   - `.next/static/`
   - `public/`
   - `next.config.ts`
   - `server.js`

### 2. On your VPS (via SSH)
1. SSH into the server:
   ```bash
   ssh username@vps-ip-address
   ```
2. Check the running PM2 processes to find your app's PM2 name:
   ```bash
   pm2 list
   ```
3. Reload or restart the application:
   ```bash
   pm2 restart <app_name_or_id>
   ```

---

## Useful PM2 Commands for Monitoring
- **Check server status**: `pm2 list`
- **View live server logs**: `pm2 logs`
- **Check system resource usage**: `pm2 monit`
