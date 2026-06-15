import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/es', '/en', '/es/register', '/en/register'],
      disallow: ['/es/dashboard', '/en/dashboard', '/es/session', '/en/session', '/api/'],
    },
    sitemap: 'https://athlete-intelligence-system.vercel.app/sitemap.xml',
  }
}
