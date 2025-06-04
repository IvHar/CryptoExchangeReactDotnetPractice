# TradeHub – Crypto Exchange Desktop App

**TradeHub** is a full-stack cryptocurrency exchange desktop application built using:

- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** ASP.NET Core Web API + PostgreSQL
- **Desktop Shell:** Electron

It supports user registration/login, cryptocurrency trading, order books, real-time charts, and image upload for cryptocurrencies. The app is packed as a Windows installer with an `.exe` file.

---

## 🚀 Features

- 🔐 JWT-based authentication & authorization
- 🧾 Order book with live updates (WebSocket-ready)
- 📈 Candlestick charts
- 💸 Buy/Sell orders
- 🧑 Admin panel to add new coins with icons
- 📦 Electron wrapper with Windows installer
- 📁 Upload images stored in `/wwwroot/coin_images`

---

## 📦 Project Structure

CryptoExchangeReactDotnetPractice/
├── CryptoExchangeReactDotnetPractice.Client/ # React Frontend
├── CryptoExchangeReactDotnetPractice.Server/ # ASP.NET Core Backend
├── electron/ # Electron wrapper
└── README.txt

---

## 🛠️ How to Run the Project

### 1. Backend Setup (.NET + PostgreSQL)

- Open `CryptoExchangeReactDotnetPractice.Server` in Visual Studio.
- Set up your database connection string in `appsettings.json`.
- Ensure PostgreSQL is running locally.
- Run the backend (F5 in Visual Studio or `dotnet run`).

> The API runs on `https://localhost:5245`

### 2. Frontend Setup (React)

```bash
cd CryptoExchangeReactDotnetPractice.Client
npm install
npm run dev
Frontend runs on http://localhost:3000

3. Electron (Development)

cd electron
npm install
npm run electron
🖼️ Add Coin with Icon (Admin)
Log in as admin.

Use "Add Coin" page.

Upload a square icon (.png or .ico) – it gets saved to wwwroot/coin_images.

🪟 Packaging as Installer (.exe)
Step-by-Step Guide
Navigate to the electron folder:

cd CryptoExchangeReactDotnetPractice/electron
Ensure correct structure:

main.js is present

buildResources/icon.ico exists (icon for your installer)

You are using correct path in BrowserWindow({ icon: ... })

Ensure these dependencies are in package.json:

"devDependencies": {
  "electron": "^36.3.2",
  "electron-builder": "^26.0.12"
}
Run the builder:

npm install
npm run dist
The installer .exe will be located in:

electron/dist/
If icon doesn't show on desktop shortcut: try deleting %localappdata%/Programs/TradeHub, reinstall, and restart Explorer.
```

## 🧠 Advanced Notes
No raw SQL is used: all queries use Entity Framework.

No stored procedures or views: design is clean and ORM-friendly.

Transactions are used in places like order execution to ensure consistency.

## 🧪 Testing
You can test:

Creating buy/sell orders

Image upload and retrieval

OrderBook updates

Admin-only access

JWT token expiration & refresh

## 📄 License
This project is licensed under the MIT License.

## 📬 Contact
Made with ❤️ by Ivan Harcenco
