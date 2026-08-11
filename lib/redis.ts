import "server-only"
import { Redis } from "@upstash/redis"

// The project exposes Vercel KV credentials under the KV_REST_API_* names.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})
