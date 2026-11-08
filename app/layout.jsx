export const metadata = {
  title: 'Statement Check | Understand your credit card statement',
  description: 'See what changed on your credit card statement and estimate when you could clear the balance.',
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
