# Cloudinary Setup Guide

This guide helps you set up Cloudinary integration with TinaCMS for automatic image optimization.

## Step 1: Create a Cloudinary Account (Free)

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

## Step 2: Get Your Credentials

1. Go to your [Cloudinary Dashboard](https://cloudinary.com/console/)
2. Find your **Cloud Name** (displays on the dashboard)
3. Create an **Upload Preset**:
   - Click "Settings" → "Upload"
   - Scroll down to "Upload presets"
   - Click "Add upload preset"
   - Set **Mode**: "Unsigned" (important for TinaCMS)
   - Set **Name**: something like `my_blog_preset`
   - Save the preset

## Step 3: Add Environment Variables

1. Create a `.env.local` file in your project root (copy from `.env.example`):

```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=my_blog_preset
```

Replace:
- `your_cloud_name` with your Cloudinary Cloud Name
- `my_blog_preset` with the upload preset name you created

## Step 4: Enable Cloudinary in TinaCMS (Full Integration)

Now that everything is set up, Cloudinary will automatically be used when you have the environment variables configured!

1. **Verify your `.env.local` file** is set up with:
   ```bash
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name
   ```

2. **Restart your dev server**:
   ```bash
   npm run dev
   ```

3. **Go to TinaCMS media manager**:
   - Open [http://localhost:3000/admin](http://localhost:3000/admin)
   - Click "Media" in the left sidebar
   - Any images you upload will now go directly to Cloudinary! 🎉

## How It Works

When you have Cloudinary credentials configured:
- The media manager automatically switches to use Cloudinary
- Images upload directly to your Cloudinary account
- Images are stored in the `tina-cms` folder on Cloudinary
- All images get automatic optimization
- Thumbnails will display in the media manager

If credentials are **not** configured, it falls back to local uploads in `/public/uploads`.

## Step 5: Test

1. Start your dev server: `npm run dev`
2. Go to Admin → Media
3. Upload an image
4. Check your [Cloudinary Dashboard](https://cloudinary.com/console/) - image should appear in the `tina-cms` folder!

## What Gets Optimized?

When using Cloudinary URLs, your images automatically get:
- ✅ WebP format conversion
- ✅ Responsive sizing based on your specified width
- ✅ Quality auto-optimization
- ✅ Format optimization
- ✅ Faster CDN delivery globally

## Current Setup

**Full Cloudinary integration is now enabled!**

If you have environment variables configured:
- ✅ Images upload directly to Cloudinary
- ✅ Media manager displays in TinaCMS
- ✅ Automatic optimization applied
- ✅ Thumbnails appear in media manager

If you don't have environment variables:
- Images upload to `/public/uploads` (no optimization)

## Example Cloudinary URL

Before transformation:
```
https://res.cloudinary.com/mycloud/image/upload/v1234567890/myimage.jpg
```

After transformation (what gets rendered):
```
https://res.cloudinary.com/mycloud/image/upload/c_limit,w_800,q_auto,f_auto/v1234567890/myimage.jpg
```

Transformations include:
- `c_limit`: Constrain to maximum width
- `w_800`: 800px max width
- `q_auto`: Auto quality optimization
- `f_auto`: Auto format selection (WebP, etc.)

---

**Questions?** Cloudinary has excellent free tier documentation at [cloudinary.com/documentation](https://cloudinary.com/documentation)
