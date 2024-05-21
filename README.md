## Installing node package

```bash
npm install
```

## Developing

Setup environmental variable:
Create .env file in root directory of project or set following entry to your system.

- JWT_ACCESS_KEY: match with jwt secret key of authentication api.
- PUBLIC_API_HOST: api hostname. eg: https://localhost:44327

Start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview` or run the production build with `node build`.
