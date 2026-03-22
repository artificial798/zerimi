import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',            // Backend logic hide karne ke liye
        '/cart',            // Cart page index nahi hona chahiye
        '/checkout',        // Payment page secure rehna chahiye
        '/admin',           // Admin dashboard block karein
        '/account',         // User profiles hide karein
        '/search?q=',       // Search result pages ko index hone se rokein
      ],
    },
    sitemap: 'https://www.zerimi.in/sitemap.xml',
  }
}