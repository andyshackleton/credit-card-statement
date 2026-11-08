# Statement Check

Next.js App Router version of the UK credit card statement checker. The original static version is preserved on `main`.

## Run locally

Use Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use **Try the sample report** to explore the report without a statement. To check the production build, run `npm run build` and then `npm start`.

The homepage uses the App Router. The guide URLs, original styles, and browser-side PDF reader are served as static assets. Statement extraction and the payoff calculator run in the browser. The app requires no API keys or database.
