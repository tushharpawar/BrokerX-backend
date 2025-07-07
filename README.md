# 📈 BrokerX Backend

Welcome to the **BrokerX Backend**, the powerhouse behind the BrokerX stock trading application. This backend is built with **Node.js**, **Express**, and **MongoDB**, and provides secure, real-time stock trading APIs, WebSocket connections, payment gateways, and more.

> 🔗 Live API: [https://brokerx-backend.onrender.com](https://brokerx-backend.onrender.com)

---

## 🚀 Features

### 🔐 Authentication
- Google OAuth Login (`/oauth/google`)
- JWT-based session handling
- Secure user management

### 💳 Payments
- **Razorpay** integration for adding money to wallet
- Order verification
- Auto-update wallet balance on successful payments

### 📊 Stocks & Market Data
- Real-time stock prices via **Finnhub WebSocket**
- **Single stock subscription** for price updates
- Alpaca (or other APIs) support for financials and company fundamentals
- Price change and % change calculations
- Market overview, 52-week range, company info, financial bars

### 💼 Orders & Holdings
- Create **buy** and **sell** orders
- Holdings are auto-managed when orders are placed
- Average cost and quantity calculated correctly for delivery-based trading
- Sell adds money back to user’s wallet
- View user orders and order history

### 🔁 Transactions
- Wallet transactions with timestamps and types (credit/debit)
- Razorpay-linked transactions for audit trail
- Withdraw request endpoint (if enabled)

### 🔔 WebSockets
- Real-time stock price broadcast for:
  - Stock cards (multiple symbols)
  - Single-stock detail screens
- Efficient connection management to prevent hitting limits

---
## 🔧 Tech Stack

- **Node.js** + **Express**
- **MongoDB** + Mongoose
- **WebSocket** (`ws`, `socket.io`)
- **Razorpay** for payments
- **Google Auth Library**
- **Finnhub / Alpaca APIs** for stock data
- **Axios**, **dotenv**, and other essentials

---

## 📦 Installation

```bash
git clone https://github.com/tushharpawar/brokerx-backend.git
cd brokerx-backend
npm install
npm run dev     # Run using nodemon
npm start       # Production start
```

🙋‍♂️ Author
Built with ❤️ by [Tushar Pawar](https://github.com/tushharpawar)
