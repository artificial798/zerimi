import { MetadataRoute } from 'next'

// Database se products lane wala function
async function getProducts() {
  try {
    const res = await fetch('https://www.zerimi.in/api/products', { next: { revalidate: 3600 } }); 
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || data; 
  } catch (error) {
    console.error("Sitemap fetch error:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.zerimi.in';

  // 1. Dynamic Products
  const products = await getProducts();
  const productUrls: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${baseUrl}/product/${product.id || product._id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 2. Static Pages (Zerimi ke saare main pages)
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`, // Home Page
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // --- CATEGORIES ---
    { url: `${baseUrl}/category/all`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/category/rings`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/category/necklaces`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/category/earrings`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/category/bracelets`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    // --- INFO & POLICIES ---
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/return-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [...staticUrls, ...productUrls];
}