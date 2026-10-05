# Collectify

> Intelligent inventory management for collectible stores, powered by AI.

Collectify is a modern inventory management system designed for stores that sell collectible products such as Funko figures, anime merchandise, plushies, pins, posters and other pop-culture products.

The project combines inventory management with an AI-powered assistant that helps store owners analyze their business information and discover potential suppliers.

---

## Live Demo

**Frontend:** https://collectify-7xcu.vercel.app

**Backend API:** https://collectify-api-udxk.onrender.com

**API Documentation:** https://collectify-api-udxk.onrender.com/docs

**Health Check:** https://collectify-api-udxk.onrender.com/health

---

## Why Collectify?

Managing a collectible store involves more than simply knowing how many products are in stock.

Store owners need to answer questions such as:

- Which products are selling the most?
- Which products need to be restocked?
- How much revenue is being generated?
- Where can I find suppliers for a specific product?
- Which suppliers could be relevant for my store?

Collectify brings these workflows together in a single application.

Instead of treating AI as a simple chatbot, Collectify integrates AI directly into the application's workflow.

---

# Features

## Inventory Management

Collectify allows store owners to manage their product catalog.

Users can:

- Create products
- Update products
- Delete products
- View inventory
- Monitor stock

Products can contain:

- Name
- Description
- Category
- SKU
- Cost
- Price
- Stock
- Image
- Active status

## Sales Management

Collectify provides a sales workflow for recording purchases.

Sales contain information such as:

- Ticket number
- Seller
- Products
- Quantity
- Unit price
- Subtotal
- Total
- Creation date

This information is also used as a data source for the AI analysis system.

---

# AI-Powered Business Analysis

One of the main features of Collectify is its AI assistant.

The AI can analyze real business data from the application's database, including:

- Products
- Inventory
- Sales
- Sale items
- Product categories
- Sales quantities
- Revenue information

For example:

> Which products should I restock?

or:

> What products are selling the most?

The backend collects the relevant data from Supabase, builds a structured context and sends it to the AI service.

The AI then generates an analysis based on the actual information from the store.

---

# AI Supplier Discovery

Collectify also includes an AI-powered supplier discovery feature.

A user can search for something like:

> Funko Pokémon

The system generates a supplier search query based on:

- Product
- Category
- Location

The backend processes the request and returns structured supplier information.

Example response:

```json
{
  "product": "Funko Pokémon",
  "category": null,
  "location": "México",
  "query": "proveedores de Funko Pokémon, categoría general, ubicación México",
  "total_results": 8,
  "answer": "Encontré distribuidores y proveedores en México...",
  "results": [
    {
      "name": "Juguetimax / DiDiMax",
      "description": "Distribuidor mayorista...",
      "category": "Distribuidor mayorista",
      "location": "México",
      "website": "https://www.distritomax.com/pages/mayoreo"
    }
  ]
}
```

The Angular application consumes this structured response and renders the suppliers as cards in the interface.

This allows the AI to become an actual application feature rather than just a conversational interface.

---

# AI Architecture

```text
User
 │
 ▼
Angular Frontend
 │
 │ POST /ai/suppliers
 ▼
FastAPI Backend
 │
 ▼
Supplier Search Service
 │
 ▼
OpenRouter
 │
 ▼
AI Model
 │
 ▼
Structured JSON Response
 │
 ▼
Angular
 │
 ▼
Supplier Cards
```

For business analysis:

```text
User Question
      │
      ▼
Angular
      │
      ▼
FastAPI
      │
      ├── Supabase Products
      ├── Supabase Sales
      └── Supabase Sale Items
      │
      ▼
Structured AI Context
      │
      ▼
OpenRouter
      │
      ▼
AI Analysis
      │
      ▼
Angular Dashboard
```

---

# Architecture

```text
┌──────────────────────────────┐
│          Frontend            │
│ Angular + TypeScript + SCSS  │
└──────────────┬───────────────┘
               │ REST API
               ▼
┌──────────────────────────────┐
│           Backend            │
│      FastAPI + Python        │
│         AI Services          │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌─────────────┐  ┌─────────────┐
│  Supabase   │  │  OpenRouter │
│ PostgreSQL  │  │     AI      │
└─────────────┘  └─────────────┘
```

---

# Technology Stack

## Frontend

- Angular
- TypeScript
- SCSS
- Angular HttpClient
- RxJS
- Angular Standalone Components

## Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

## Database

- Supabase
- PostgreSQL

## Artificial Intelligence

- OpenRouter
- AI models available through OpenRouter
- Structured AI responses

## Deployment

- Vercel — Frontend
- Render — Backend
- Supabase — Database

---

# API

Collectify exposes a REST API through FastAPI.

## Products

```text
GET    /products
POST   /products
PATCH  /products/{id}
DELETE /products/{id}
```

## Sales

```text
POST /sales
```

## Partners

```text
GET    /partners
POST   /partners
PATCH  /partners/{id}
DELETE /partners/{id}
```

## Earnings

```text
GET /earnings
```

## AI Business Analysis

```text
POST /ai/analyze
```

Example:

```json
{
  "question": "¿Qué productos debería reabastecer?"
}
```

## AI Supplier Search

```text
POST /ai/suppliers
```

Example:

```json
{
  "product": "Funko Pokémon",
  "category": "Coleccionables",
  "location": "México"
}
```

## Health Check

```text
GET /health
```

---

# Local Development

## Requirements

- Node.js
- pnpm
- Python
- Git
- A Supabase project
- An OpenRouter API key

## Clone

```bash
git clone https://github.com/Ezequie1Sc/collectify.git
cd collectify
```

## Frontend

```bash
cd frontend/collectify
pnpm install
pnpm exec ng serve
```

Available at:

```text
http://localhost:4200
```

## Backend

```bash
cd backend
python -m venv venv
```

Windows:

```powershell
.env\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Available at:

```text
http://127.0.0.1:8000
```

Interactive documentation:

```text
http://127.0.0.1:8000/docs
```

---

# Deployment

## Frontend

Deployed with Vercel:

https://collectify-7xcu.vercel.app

## Backend

Deployed with Render:

https://collectify-api-udxk.onrender.com

Health endpoint:

```text
/health
```

---

# Hacktoberfest / DEV Challenge

Collectify was created as part of the Hacktoberfest DEV Challenges.

The project focuses on building a real application around AI rather than creating an isolated chatbot.

Instead of:

```text
User → Chatbot → Text
```

Collectify implements:

```text
User
  ↓
Business Problem
  ↓
Collectify
  ↓
AI Processing
  ↓
Structured Data
  ↓
Application UI
  ↓
Business Decision
```

The AI is therefore integrated into the application itself.

---

# What Makes Collectify Different?

Many inventory systems focus only on CRUD operations.

Collectify connects:

```text
Inventory
     +
Sales
     +
Business Analytics
     +
AI
     +
Supplier Discovery
```

This allows the system to move from simply recording information to helping the store owner make decisions.

Example workflow:

```text
Low inventory
      ↓
AI identifies product
      ↓
Supplier search
      ↓
Potential suppliers
      ↓
Store owner evaluates options
      ↓
Restock decision
```

---

# Future Improvements

- Automatic low-stock detection
- AI-generated restocking recommendations
- Supplier comparison
- Supplier scoring
- Price comparison
- Sales forecasting
- Demand prediction
- AI-generated business reports
- Product profitability analysis
- Purchase order generation
- Notifications for low inventory
- Authentication and role-based access
- Advanced analytics dashboard

---

# Security

Sensitive credentials are stored through environment variables.

Never commit:

```text
.env
API keys
Supabase service keys
OpenRouter API keys
```

---

# Author

Developed by **Ezequiel Salazar Cruz**

Computer Systems Engineering student.

GitHub:

https://github.com/Ezequie1Sc

---

# License

This project is open source and available under the MIT License.
