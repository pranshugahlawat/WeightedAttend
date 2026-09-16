export { auth as middleware } from "@/auth";

// Protect only app pages. APIs use requireUserId() internally.
// This avoids breaking NextAuth routes under /api/auth/*
export const config = {
  matcher: ["/dashboard", "/subjects", "/timetable", "/attendance", "/calendar", "/import", "/profiles", "/settings"]
};