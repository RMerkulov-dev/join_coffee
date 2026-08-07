import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The project lives inside iCloud Drive, so pin the workspace root instead of
  // letting Turbopack walk up and find an unrelated lockfile.
  turbopack: { root: path.resolve(process.cwd()) },
}

export default nextConfig
