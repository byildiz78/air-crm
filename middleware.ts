import { withAuth } from 'next-auth/middleware'

/**
 * Check if request has valid Bearer token
 */
function hasBearerToken(req: any): boolean {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  const expectedToken = process.env.API_BEARER_TOKEN
  
  return expectedToken && token === expectedToken
}

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow auth endpoints
        if (pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Admin routes require ADMIN or RESTAURANT_ADMIN role
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.role === 'RESTAURANT_ADMIN'
        }
        
        // API routes require authentication (session OR bearer token)
        if (pathname.startsWith('/api')) {
          // Check Bearer token first
          if (hasBearerToken(req)) {
            return true
          }
          // Fallback to session check
          return !!token
        }
        
        // Client routes require any authenticated user
        if (pathname.startsWith('/profile') || pathname.startsWith('/loyalty-card')) {
          return !!token
        }
        
        return true
      }
    }
  }
)

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/loyalty-card/:path*', '/api/:path*']
}