import { withAuth } from 'next-auth/middleware'

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
        
        // API routes require authentication
        if (pathname.startsWith('/api')) {
          // TEMPORARY: Allow transactions API for testing
          if (pathname.startsWith('/api/transactions')) {
            return true
          }
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