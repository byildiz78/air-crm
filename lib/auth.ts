import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import * as bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('=== NEXTAUTH AUTHORIZE START ===')
        console.log('Authorize called with:', credentials?.email)
        console.log('Environment NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
        console.log('Environment DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials - email:', !!credentials?.email, 'password:', !!credentials?.password)
          return null
        }

        try {
          console.log('Looking up user in database...')
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })
          
          console.log('User found:', user?.email, 'Has password:', !!user?.password)
          console.log('User ID:', user?.id)
          console.log('User role:', user?.role)

          if (!user || !user.password) {
            console.log('User not found or no password')
            return null
          }

          console.log('Comparing passwords...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          
          console.log('Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('Password invalid, returning null')
            return null
          }

          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
          
          console.log('Authorization successful, returning user:', returnUser)
          return returnUser
          
        } catch (error) {
          console.error('Database error in authorize:', error)
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
    signIn: '/login'
  }
}