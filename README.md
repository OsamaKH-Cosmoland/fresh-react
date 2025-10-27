# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Telegram Alerts

1. Talk to [@BotFather](https://t.me/BotFather) in Telegram and create a new bot to receive your **BOT TOKEN**.
2. Open a chat with your bot and send `/start` so it can message you.
3. Retrieve your **chat id** by visiting `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` after sending a message to the bot.
4. Copy `.env.example` to `.env` and fill in `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Restart the dev server so the new env vars load.
5. Verify the integration by visiting `http://localhost:3000/api/notify-test` (requires `npm run dev` to be running). You should receive a Telegram message immediately.
6. Place a real order through the storefront – every successful order triggers Telegram in addition to email/SSE notifications.

### Deployment Notes

- On Vercel, Netlify, Render, or similar platforms, configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the dashboard’s environment variables.
- You do not need `dotenv` in production if the platform supplies env vars – they will be exposed to the server runtime automatically.
- Ensure the hosting provider allows outbound HTTPS requests to `https://api.telegram.org`.
