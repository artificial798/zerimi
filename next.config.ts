/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary Images
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Firebase Storage
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google Profile Images
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com', // Icons
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Placeholders
      }
    ],
  },
}

module.exports = nextConfig