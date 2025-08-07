import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import * as bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('=== NEXTAUTH AUTHORIZE DETAILED DEBUG ===')
        console.log('Timestamp:', new Date().toISOString())
        console.log('Node version:', process.version)
        console.log('Platform:', process.platform)
        console.log('CWD:', process.cwd())
        console.log('Credentials received:', {
          email: credentials?.email,
          passwordLength: credentials?.password?.length
        })
        
        console.log('=== ENVIRONMENT CHECK ===')
        console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
        console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
        console.log('DATABASE_URL:', process.env.DATABASE_URL)
        console.log('NODE_ENV:', process.env.NODE_ENV)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('AUTHORIZATION FAILED: Missing credentials')
          console.log('Email provided:', !!credentials?.email)
          console.log('Password provided:', !!credentials?.password)
          return null
        }

        try {
          console.log('=== DATABASE CONNECTION TEST ===')
          console.log('Attempting to connect to database...')
          
          // Test database connection
          const testConnection = await prisma.$queryRaw`SELECT 1 as test`
          console.log('Database connection successful:', testConnection)
          
          console.log('Looking up user:', credentials.email)
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })
          
          console.log('=== USER LOOKUP RESULT ===')
          console.log('User found:', !!user)
          if (user) {
            console.log('User ID:', user.id)
            console.log('User email:', user.email)
            console.log('User name:', user.name)
            console.log('User role:', user.role)
            console.log('Has password:', !!user.password)
            console.log('Password hash length:', user.password?.length)
          }

          if (!user || !user.password) {
            console.log('AUTHORIZATION FAILED: User not found or no password')
            return null
          }

          console.log('=== PASSWORD VERIFICATION ===')
          console.log('Input password length:', credentials.password.length)
          console.log('Stored hash length:', user.password.length)
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          
          console.log('Password comparison result:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('AUTHORIZATION FAILED: Invalid password')
            return null
          }

          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
          
          console.log('=== AUTHORIZATION SUCCESS ===')
          console.log('Returning user:', returnUser)
          return returnUser
          
        } catch (error) {
          console.error('=== DATABASE ERROR ===')
          console.error('Error type:', error?.constructor?.name)
          console.error('Error message:', error instanceof Error ? error.message : String(error))
          console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown')
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login' // Handle errors on login page
  }
}