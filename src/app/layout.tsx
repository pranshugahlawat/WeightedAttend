import Footer from "@/components/Footer";
import "./globals.css";

export const metadata = {
  title: "WeightedAttend",
  description: "Weighted attendance tracker with OCR timetable import"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
      <Footer/>
    </html>
  );
}