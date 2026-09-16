import Footer from "@/components/Footer";
import "./global.css";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "WeightedAttend",
  description: "Weighted attendance tracker with OCR timetable import"
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/signin");
  return (
    <html lang="en">
      <body>{children}</body>
      <Footer/>
    </html>
  );
}