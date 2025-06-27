# CryptoExchangeReactDotnetPractice

A full-stack cryptocurrency exchange application built with **React (Next.js + Tailwind CSS)** frontend and **ASP.NET Web API** on the backend. The app supports spot trading, wallet management, and real-time market data using order books.

## 🛠 Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS, TypeScript
- **Backend**: ASP.NET Core 7, Entity Framework Core, JWT Auth
- **Database**: Microsoft SQL Server
- **Build Tools**: npm, .NET CLI
- **Image Storage**: Server-side file upload (`wwwroot/coin_images`)

---

## 🚀 Getting Started

### Requirements

- [.NET 7 SDK](https://dotnet.microsoft.com/download/dotnet/7.0)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/) (or Docker)

---

### 🔧 Backend Setup

```bash
cd CryptoExchangeReactDotnetPractice.Server
```

1. Configure `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.;Database=crypto_db;Trusted_Connection=True;TrustServerCertificate=True"
}
```

2. Run database migration:

```bash
dotnet ef database update
```

3. Start backend:

```bash
dotnet run
```

---

### 💻 Frontend Setup
By default dotnet run also launches ```npm run dev```, but if you want to start only the frontend:

```bash
cd cryptoexchangereactdotnetpractice.client
npm install
npm dev
```

Frontend runs at `http://localhost:3000`, proxying API calls to backend at `http://localhost:5245`.

---

## 🔐 Authentication

- `POST /api/auth/register` – register new user  
- `POST /api/auth/login` – login and receive JWT  

JWT stored in browser and used to access protected routes.

---

## 📦 API Endpoints

| Method | Path                          | Description                        |
|--------|-------------------------------|------------------------------------|
| POST   | `/api/auth/register`         | Register new user                  |
| POST   | `/api/auth/login`            | Authenticate user                  |
| GET    | `/api/coins`                 | Get all coins                      |
| GET    | `/api/coins/{id}`            | Get coin by ID                     |
| GET    | `/api/markets/orderbook`     | Get order book for a pair          |
| GET    | `/api/wallets/balance`       | User wallet balances               |
| POST   | `/api/wallets/deposit`       | Deposit funds                      |
| POST   | `/api/wallets/withdraw`      | Withdraw funds                     |
| ...    | ...                          | ...                                |


You can explore all available endpoints and test them directly using Swagger UI:

👉 **[Swagger UI](http://localhost:5245/swagger)**  
(run the backend first)


---

## 📁 Folder Structure

```
.
├── CryptoExchangeReactDotnetPractice.Server
│   ├── Controllers
│   ├── DTOs, Models, Services, Repositories
│   └── wwwroot/coin_images
├── cryptoexchangereactdotnetpractice.client
│   ├── app (Next.js pages)
│   ├── components, hooks, lib
│   └── public, styles, tailwind.config.ts
```

---

## 🧠 Features

- 🪙 Wallet system (with deposit/withdraw)
- 📈 Real-time order book visualization
- 📄 Trade history tracking
- 👤 User JWT auth
- 🖼 Image upload for admin-added coins

---

## 🧪 Sample Request

```http
POST http://localhost:5245/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

---

## 👤 Author
[**Ivan Harcenco**](https://github.com/IvHar)

![GitHub stars](https://img.shields.io/github/stars/IvHar/CryptoExchangeReactDotnetPractice?style=social)
![GitHub license](https://img.shields.io/github/license/IvHar/CryptoExchangeReactDotnetPractice)
