export const metadata = {
  title: 'Free UK Credit Card Statement Checker | Statement Check',
  description: 'Check a UK credit card statement PDF for interest, fees and balance changes. Compare repayment estimates for free, with your PDF kept on your device.',
  alternates: { canonical: 'https://credit-card-statement.vercel.app/' },
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/statement-tool.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
