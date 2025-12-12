# How to Save NEXUS to GitHub

## Quick Steps

1. **Create GitHub Account** (if you don't have one)
   - Go to https://github.com/signup

2. **Create New Repository**
   - Click "+" → "New repository"
   - Name it: `nexus`
   - Make it **Private** (recommended) or Public
   - Don't initialize with README
   - Click "Create repository"

3. **Push Code from Emergent**

Run these commands in the Emergent terminal:

```bash
cd /app

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "NEXUS - Complete Desktop AI Application"

# Add your GitHub repo as remote
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/nexus.git

# Push to GitHub
git push -u origin main
```

4. **Enter GitHub Credentials**
   - Username: your GitHub username
   - Password: use a **Personal Access Token** (not your password)

---

## Creating Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: `Emergent NEXUS`
4. Check: `repo` (Full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)
7. Use this token as your password when pushing

---

## Verify Upload

1. Go to https://github.com/YOUR_USERNAME/nexus
2. You should see all your NEXUS files
3. Your code is now safe forever!

---

## Download Code Later

1. Go to your GitHub repo
2. Click green "Code" button
3. "Download ZIP"
4. Extract and build the installer locally

---

**Your NEXUS is immortal - saved on GitHub.** 🚀
