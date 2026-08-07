import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Brew Log',
    short_name: 'Brew Log',
    description: 'A brewing journal for finding the right recipe, one cup at a time.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f2ed',
    theme_color: '#f1f2ed',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
