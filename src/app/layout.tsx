import Footer from "@/components/Footer";
import "./global.css";

export const metadata = {
  title: "WeightedAttend",
  description: "Weighted attendance tracker with OCR timetable import"
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}<Footer/></body>
    </html>
  );
}