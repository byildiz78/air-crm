import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

const handler = NextAuth(authOptions)

export async function GET(request: NextRequest) {
  return handler(request as any, {} as any)
}

export async function POST(request: NextRequest) {
  return handler(request as any, {} as any)
}