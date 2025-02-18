import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Add Razorpay Script Here */}
          <script
            id="razorpay-script"
            src="https://checkout.razorpay.com/v1/checkout.js"
            async
          ></script>
        </head>
        <body className="min-h-screen h-screen overflow-hidden flex flex-col">
          <Toaster/>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}