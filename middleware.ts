import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/trade(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const session = await auth()
    if (!session.userId) {
      return session.redirectToSignIn({ returnBackUrl: req.url })
    }
  }
})

export const config = {
  matcher: [
    "/((?!_next|_vercel|.*\\..*).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}


