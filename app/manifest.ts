import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Family HQ',
    short_name: 'Family HQ',
    description: 'Family day planner — missions, rewards, schedule & groceries',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1E1B4B',
    theme_color: '#1E1B4B',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
