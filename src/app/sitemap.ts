import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://athlete-intelligence-system.vercel.app'
  return [
    { url: `${base}/es`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/en`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/es/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/en/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/es/upgrade`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/en/upgrade`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/es/onboarding`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/en/onboarding`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
