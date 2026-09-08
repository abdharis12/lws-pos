# LWS-POS AI Agent — Architecture Blueprint

> **Status:** Proposed Architecture
> **Project:** LWS-POS
> **Laravel:** 13
> **AI Orchestrator:** n8n
> **LLM Provider:** Groq / LLM
> **Database:** MySQL
> **Cache & Queue:** Redis
> **Realtime:** Laravel Reverb
> **Frontend:** Inertia + React/Vue
> **Channels:** WhatsApp, Telegram, Web Chat

---

# 1. Architecture Principles

Arsitektur AI LWS-POS menggunakan prinsip:

> **n8n mengurus channel dan AI orchestration, Laravel mengurus seluruh business logic POS, dan MySQL menjadi source of truth.**

Pembagian tanggung jawab:

| Komponen            | Tanggung Jawab                             |
| ------------------- | ------------------------------------------ |
| WhatsApp            | Customer communication                     |
| Telegram            | Customer communication                     |
| Web Chat            | Customer/Owner communication               |
| n8n                 | Workflow orchestration                     |
| LLM                 | Natural language understanding & reasoning |
| Laravel             | Business logic, authorization, validation  |
| MySQL               | Source of truth                            |
| Redis               | Queue, cache, rate limit, lock             |
| Reverb              | Real-time events                           |
| Inertia + React/Vue | Owner dashboard                            |

### Golden Rule

```text
AI BOLEH MEMUTUSKAN:
"Apa yang ingin dilakukan?"

AI TIDAK BOLEH MEMUTUSKAN:
"Apakah tindakan tersebut valid?"
```

Validasi dan keputusan final selalu dilakukan oleh Laravel.

---

# 2. High-Level Architecture

```text
                         ┌──────────────────────┐
                         │       CUSTOMER       │
                         └───────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
                WhatsApp         Telegram          Web Chat
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │         n8n          │
                         │                      │
                         │ Channel Gateway      │
                         │ AI Orchestrator      │
                         │ Session Routing      │
                         │ Tool Calling         │
                         │ Retry / Fallback     │
                         │ Human Handoff        │
                         └───────────┬──────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │       LLM / Groq     │
                         │                      │
                         │ Reasoning            │
                         │ Intent Detection     │
                         │ Tool Selection       │
                         └───────────┬──────────┘
                                     │
                                Tool Calling
                                     │
                                     ▼
              ┌────────────────────────────────────────┐
              │              LARAVEL 13                 │
              │                                        │
              │ AI Gateway                             │
              │      ↓                                 │
              │ Authorization                          │
              │      ↓                                 │
              │ AI Tools                               │
              │      ↓                                 │
              │ POS Services                           │
              │      ↓                                 │
              │ Business Rules                         │
              └───────────────────┬────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                 MySQL          Redis         Reverb
                    │                           │
                    │                           ▼
                    │                    Owner Dashboard
                    │
                    ▼
               POS DATA
```

---

# 3. Responsibility Boundary

## 3.1 n8n

n8n bertanggung jawab terhadap:

* menerima pesan dari channel;
* normalisasi payload;
* routing;
* menjalankan AI Agent;
* memanggil LLM;
* tool calling;
* retry;
* fallback;
* human handoff;
* mengirim response ke channel.

n8n **tidak bertanggung jawab terhadap business logic POS**.

---

## 3.2 Laravel

Laravel bertanggung jawab terhadap:

* authentication;
* authorization;
* outlet isolation;
* customer identity;
* menu;
* harga;
* stok;
* order;
* pembayaran;
* discount;
* tax;
* inventory;
* business rules;
* transaction;
* audit log.

Laravel adalah **authoritative backend**.

---

## 3.3 MySQL

MySQL merupakan:

> **Single Source of Truth**

AI tidak boleh membuat data POS sendiri.

Contoh:

```text
Harga AI              ❌
Harga Laravel         ✅

Stok AI               ❌
Stok Laravel          ✅

Total Order AI        ❌
Total Order Laravel   ✅

Status Payment AI     ❌
Status Payment Laravel ✅
```

---

# 4. Message Flow

Flow utama:

```text
Customer
   │
   ▼
WhatsApp / Telegram
   │
   ▼
n8n Webhook
   │
   ▼
Normalize Message
   │
   ▼
Identify Channel
   │
   ▼
Identify Customer
   │
   ▼
Identify Outlet
   │
   ▼
Get/Create Chat Session
   │
   ▼
Check Session Status
   │
   ├─────────────── HUMAN ────────────────► Owner
   │
   └── AI
        │
        ▼
    Load Context
        │
        ▼
      LLM
        │
        ▼
   Need Tool?
      /    \
    No      Yes
    │        │
    │        ▼
    │    Laravel AI Tool
    │        │
    │        ▼
    │    Tool Result
    │        │
    └────┬───┘
         ▼
    Final Response
         │
         ▼
    Save Message
         │
         ▼
    Send Response
         │
         ▼
    Broadcast Reverb
```

---

# 5. n8n Workflow Architecture

Workflow sebaiknya tidak dibuat menjadi satu workflow besar.

Struktur:

```text
n8n/
│
├── inbound/
│   ├── whatsapp
│   ├── telegram
│   └── webchat
│
├── ai/
│   ├── customer-agent
│   ├── owner-agent
│   └── intent-router
│
├── tools/
│   ├── menu
│   ├── stock
│   ├── order
│   ├── customer
│   └── owner
│
├── outbound/
│   ├── whatsapp
│   ├── telegram
│   └── webchat
│
└── system/
    ├── error-handler
    ├── retry
    ├── human-handoff
    └── monitoring
```

---

# 6. Customer AI Agent

Customer Agent hanya mendapatkan tools yang aman untuk customer.

```text
Customer
   │
   ▼
Customer AI Agent
   │
   ├── menu.get_catalog
   ├── menu.get_detail
   ├── menu.get_availability
   ├── order.calculate
   ├── order.create
   ├── order.detail
   └── customer.orders
```

Customer tidak mendapatkan akses ke:

```text
owner.sales_summary
owner.profit_summary
owner.stock_report
supplier
employee
purchase_cost
internal_financial_data
```

---

# 7. Owner AI Agent

Owner Agent dapat menggunakan tools internal berdasarkan authorization Laravel.

```text
Owner
   │
   ▼
Owner AI Agent
   │
   ├── menu.get_catalog
   ├── menu.get_availability
   ├── stock.summary
   ├── order.summary
   ├── owner.sales_summary
   ├── owner.stock_report
   └── owner.profit_summary
```

Authorization tetap dilakukan Laravel.

---

# 8. Laravel AI Gateway

Laravel menyediakan endpoint khusus untuk komunikasi service-to-service dengan n8n.

Base URL:

```text
/api/ai/v1
```

Endpoint utama:

```http
POST /api/ai/v1/tools/execute
```

Request:

```json
{
    "tool": "menu.get_availability",
    "arguments": {
        "menu_id": 15
    }
}
```

Response:

```json
{
    "success": true,
    "tool": "menu.get_availability",
    "data": {
        "menu_id": 15,
        "name": "Bubur Ayam",
        "price": 15000,
        "available": true,
        "stock": 12
    }
}
```

---

# 9. AI Tool Layer

Struktur Laravel:

```text
app/
└── AI/
    │
    ├── Tools/
    │   │
    │   ├── Menu/
    │   │   ├── GetMenuCatalogTool.php
    │   │   ├── GetMenuDetailTool.php
    │   │   └── GetMenuAvailabilityTool.php
    │   │
    │   ├── Stock/
    │   │   ├── GetMenuStockTool.php
    │   │   └── CheckStockTool.php
    │   │
    │   ├── Order/
    │   │   ├── CalculateOrderTool.php
    │   │   ├── CreateOrderTool.php
    │   │   ├── GetOrderTool.php
    │   │   └── CancelOrderTool.php
    │   │
    │   ├── Customer/
    │   │   ├── GetCustomerProfileTool.php
    │   │   └── GetCustomerOrdersTool.php
    │   │
    │   └── Owner/
    │       ├── GetSalesSummaryTool.php
    │       ├── GetStockReportTool.php
    │       └── GetProfitSummaryTool.php
    │
    ├── DTO/
    │   ├── AIToolRequest.php
    │   ├── AIToolResponse.php
    │   └── AIContext.php
    │
    ├── Services/
    │   └── AIGatewayService.php
    │
    └── Exceptions/
        ├── AIToolUnauthorized.php
        └── AIToolValidationException.php
```

---

# 10. Existing POS Services

AI Tool **tidak boleh menduplikasi business logic**.

Contoh:

```text
AI Tool
   │
   ▼
MenuCatalogService
   │
   ▼
Existing POS Logic
   │
   ▼
MySQL
```

Contoh:

```php
final class GetMenuCatalogTool
{
    public function __construct(
        private MenuCatalogService $menuCatalogService
    ) {}

    public function execute(AIContext $context): array
    {
        return $this->menuCatalogService
            ->getForOutlet($context->outletId);
    }
}
```

Prinsip:

```text
AI Tool
  ↓
Existing Service
  ↓
Business Logic
  ↓
Database
```

Bukan:

```text
AI Tool
  ↓
Query Database langsung
```

---

# 11. Tool Authorization

Setiap tool memiliki permission.

Contoh:

```text
menu.get_catalog
    → customer, owner, admin

menu.get_availability
    → customer, owner, admin

order.create
    → customer, owner

owner.sales_summary
    → owner, admin, superadmin

owner.profit_summary
    → owner, admin, superadmin
```

Laravel harus melakukan:

```text
n8n
 ↓
session_id
 ↓
Laravel
 ↓
resolve user
 ↓
resolve role
 ↓
resolve outlet
 ↓
check permission
 ↓
execute tool
```

Jangan mempercayai:

```json
{
    "type": "owner"
}
```

yang dikirim oleh n8n tanpa validasi server-side.

---

# 12. Authentication n8n → Laravel

Gunakan service authentication.

```text
n8n
 │
 │ HTTPS
 │ Authorization: Bearer <SERVICE_TOKEN>
 ▼
Laravel AI Gateway
```

Environment:

```env
AI_SERVICE_TOKEN=change-this-secret
```

Endpoint AI harus:

```text
HTTPS only
Authentication required
Rate limited
Logged
Audited
```

n8n tidak mendapatkan kredensial database Laravel.

---

# 13. Customer Context

Jangan mengirim seluruh database ke LLM.

Context minimal:

```json
{
    "session": {
        "id": 123,
        "type": "customer",
        "outlet_id": 1
    },
    "customer": {
        "id": 45
    },
    "conversation": [
        {
            "role": "user",
            "content": "Saya mau bubur"
        }
    ]
}
```

Jika membutuhkan informasi POS:

```text
LLM
 ↓
Tool Call
 ↓
Laravel
 ↓
POS Service
 ↓
Result
 ↓
LLM
```

---

# 14. Conversation Memory

Database:

```text
chat_sessions
chat_messages
```

Jangan bergantung hanya pada:

```text
context_memory JSON
```

Untuk production:

```text
Conversation
     │
     ├── Recent messages
     │
     ├── Conversation summary
     │
     ├── Customer context
     │
     └── Current POS context
```

Contoh:

```text
Conversation Summary:

Customer sering memesan Bubur Ayam.
Pesanan terakhir: ORD-0012.
Customer memiliki 1 order pending.
```

Recent messages:

```text
User: Ada bubur?
AI: Ada kak.
User: Saya pesan 2.
```

---

# 15. Database Chat

## chat_sessions

```text
id
external_id
channel
type
customer_id
user_id
outlet_id
status
last_message_at
metadata
created_at
updated_at
```

Status:

```text
ai
waiting_human
human
closed
```

## chat_messages

```text
id
chat_session_id
from
role
content
message_type
external_message_id
raw_response
metadata
created_at
updated_at
```

Sender:

```text
customer
assistant
owner
system
```

---

# 16. AI Logging

Tambahkan:

```text
ai_logs
```

Fields:

```text
id
chat_session_id
model
provider
input_tokens
output_tokens
total_tokens
latency_ms
tool_name
status
error
metadata
created_at
```

Tujuannya:

* debugging;
* audit;
* cost tracking;
* performance monitoring;
* AI quality analysis.

---

# 17. Order Flow

Order merupakan operasi kritikal.

```text
Customer:
"Pesan 2 Bubur Ayam"
        │
        ▼
      n8n
        │
        ▼
       LLM
        │
        ▼
order.calculate
        │
        ▼
     Laravel
        │
        ├── Validate menu
        ├── Validate option
        ├── Check availability
        ├── Check stock
        ├── Calculate price
        ├── Calculate modifier
        ├── Calculate discount
        └── Calculate tax
        │
        ▼
     Result
        │
        ▼
Customer confirms
        │
        ▼
order.create
        │
        ▼
Laravel DB Transaction
        │
        ├── Create Order
        ├── Create Order Items
        ├── Update Stock
        ├── Create Payment
        └── Commit
```

LLM tidak menentukan total final.

---

# 18. Idempotency

Setiap operasi mutation harus memiliki idempotency key.

Contoh:

```text
channel: whatsapp
external_message_id: AB123
```

Idempotency key:

```text
whatsapp:AB123:order:create
```

Flow:

```text
Request
   │
   ▼
Check Idempotency
   │
   ├── Already processed → return previous result
   │
   └── New
        │
        ▼
   Process transaction
        │
        ▼
   Store result
```

Tujuannya mencegah:

```text
Retry
 ↓
Order #001
Order #002
```

menjadi:

```text
Order #001
```

saja.

---

# 19. Payment Security

AI boleh membaca:

```text
payment.get_status
```

Tetapi operasi sensitif:

```text
refund
void
confirm_payment
change_payment
```

harus melalui authorization tambahan.

Untuk MVP:

```text
AI → read-only payment status
```

Mutation payment:

```text
AI
 ↓
Request Action
 ↓
Owner Confirmation
 ↓
Laravel
 ↓
Payment Service
```

---

# 20. Human Handoff

Session state:

```text
AI_ACTIVE
WAITING_HUMAN
HUMAN_ACTIVE
CLOSED
```

Flow:

```text
Customer
   │
   ▼
AI
   │
   ▼
AI detects human request
   │
   ▼
Laravel
   │
   ▼
WAITING_HUMAN
   │
   ▼
Owner notification
   │
   ▼
Owner Take Over
   │
   ▼
HUMAN_ACTIVE
```

Owner dapat:

```text
Take Over
Resume AI
Close Conversation
```

---

# 21. Laravel Reverb

Reverb digunakan untuk real-time owner dashboard.

Events:

```text
ChatMessageCreated
AIResponseCreated
HumanHandoffRequested
OrderCreated
OrderPaid
AIError
```

Flow:

```text
Customer
   ↓
n8n
   ↓
Laravel
   ↓
Event
   ↓
Reverb
   ↓
Owner Dashboard
```

Channel:

```text
private-owner.outlet.{outletId}
```

---

# 22. Owner Dashboard

Struktur:

```text
Owner AI
│
├── Conversations
│
├── Active Chats
│
├── Waiting Human
│
├── AI Orders
│
├── AI Activity
│
├── AI Errors
└── Analytics
```

Conversation screen:

```text
┌────────────────────────────────────┐
│ Customer #0812                     │
│ ● AI Active                        │
├────────────────────────────────────┤
│                                    │
│ Customer:                          │
│ "Masih ada bubur ayam?"            │
│                                    │
│ AI:                                │
│ "Masih tersedia 12 porsi."        │
│                                    │
│ Customer:                          │
│ "Pesan 2."                         │
│                                    │
│ AI:                                │
│ "Total Rp30.000."                 │
│                                    │
├────────────────────────────────────┤
│ [Take Over] [Close]                │
└────────────────────────────────────┘
```

---

# 23. Redis

Redis digunakan untuk:

```text
Queue
Cache
Rate Limiting
Session State
Idempotency
Distributed Lock
Temporary AI State
```

Contoh key:

```text
ai:session:123
ai:rate-limit:+628xxx
ai:idempotency:whatsapp:ABC123
ai:lock:order:123
```

---

# 24. Queue Architecture

Gunakan queue untuk pekerjaan asynchronous.

```text
ProcessAIMessage
SendWhatsAppMessage
SendTelegramMessage
BroadcastChatMessage
GenerateAIReport
```

Flow:

```text
n8n
 ↓
Laravel
 ↓
Redis Queue
 ↓
Worker
 ↓
Process
```

Untuk operasi read yang cepat:

```text
get_menu
check_stock
get_order
```

boleh synchronous.

---

# 25. Error Handling

```text
             AI REQUEST
                  │
                  ▼
                 n8n
                  │
             ┌────┴────┐
             │         │
          SUCCESS     ERROR
             │         │
             ▼         ▼
          Response    Retry
                         │
                    ┌────┴────┐
                    │         │
                 SUCCESS    FAILED
                    │         │
                    ▼         ▼
                 Response   Fallback
                              │
                              ▼
                         Human Handoff
```

Customer tidak boleh melihat error internal.

Jangan:

```text
500 Internal Server Error
```

Gunakan:

```text
"Maaf kak, sistem sedang mengalami gangguan.
Saya akan teruskan ke admin."
```

---

# 26. Rate Limiting

Rate limit berdasarkan:

```text
Customer
Phone number
IP
Outlet
Session
Tool
```

Contoh:

```text
Customer messages:
30 / minute

Order creation:
10 / minute

Owner:
higher limit
```

---

# 27. Security Model

## Customer

```text
menu
price
availability
customer_orders
order_create
order_detail
```

## Owner

```text
menu
stock
orders
sales
profit
reports
```

## AI

```text
No direct database access
No raw payment access
No authorization bypass
No arbitrary SQL
No direct POS mutation
```

---

# 28. API Contract

Semua komunikasi n8n → Laravel menggunakan contract terstruktur.

Request:

```json
{
    "request_id": "req_abc123",
    "session_id": 123,
    "tool": "order.calculate",
    "arguments": {
        "items": [
            {
                "menu_id": 15,
                "quantity": 2
            }
        ]
    }
}
```

Response success:

```json
{
    "success": true,
    "request_id": "req_abc123",
    "tool": "order.calculate",
    "data": {
        "items": [
            {
                "menu_id": 15,
                "quantity": 2,
                "unit_price": 15000,
                "subtotal": 30000
            }
        ],
        "total": 30000
    }
}
```

Response error:

```json
{
    "success": false,
    "request_id": "req_abc123",
    "error": {
        "code": "INSUFFICIENT_STOCK",
        "message": "Stok Bubur Ayam tidak mencukupi."
    }
}
```

---

# 29. Recommended MVP Tools

Jangan langsung membuat terlalu banyak tools.

## Customer

```text
1. menu.get_catalog
2. menu.get_detail
3. menu.get_availability
4. order.calculate
5. order.create
6. order.detail
7. customer.orders
```

## Owner

```text
8. owner.sales_summary
9. owner.stock_summary
10. owner.order_summary
```

## System

```text
11. session.get_context
12. human.handoff
```

Total:

```text
12 tools
```

Ini sudah cukup untuk MVP.

---

# 30. Laravel Project Structure

```text
app/
│
├── AI/
│   ├── Tools/
│   │   ├── Menu/
│   │   ├── Stock/
│   │   ├── Order/
│   │   ├── Customer/
│   │   └── Owner/
│   │
│   ├── DTO/
│   │   ├── AIToolRequest.php
│   │   ├── AIToolResponse.php
│   │   └── AIContext.php
│   │
│   ├── Services/
│   │   └── AIGatewayService.php
│   │
│   └── Exceptions/
│
├── Http/
│   ├── Controllers/
│   │   ├── AI/
│   │   │   └── AIToolController.php
│   │   ├── Webhooks/
│   │   └── Owner/
│   │
│   ├── Middleware/
│   │   └── AIServiceAuthentication.php
│   │
│   └── Requests/
│
├── Jobs/
│   ├── ProcessAIMessage.php
│   ├── SendWhatsAppMessage.php
│   └── GenerateAIReport.php
│
├── Events/
│   ├── ChatMessageCreated.php
│   ├── HumanHandoffRequested.php
│   └── AIActionExecuted.php
│
├── Models/
│   ├── ChatSession.php
│   ├── ChatMessage.php
│   └── AILog.php
│
└── Services/
    ├── ChatService.php
    ├── MenuCatalogService.php
    ├── StockService.php
    ├── OrderService.php
    └── PaymentService.php
```

---

# 31. n8n Project Structure

```text
n8n/
│
├── INBOUND
│   ├── WhatsApp
│   ├── Telegram
│   └── WebChat
│
├── AI
│   ├── Customer Agent
│   ├── Owner Agent
│   └── Intent Router
│
├── TOOLS
│   ├── Menu
│   ├── Stock
│   ├── Order
│   ├── Customer
│   └── Owner
│
├── OUTBOUND
│   ├── WhatsApp
│   ├── Telegram
│   └── WebChat
│
└── SYSTEM
    ├── Error Handler
    ├── Retry
    ├── Human Handoff
    └── Monitoring
```

---

# 32. Example: Customer Asking Stock

Customer:

```text
"Kak, masih ada bubur ayam?"
```

Flow:

```text
WhatsApp
   ↓
n8n
   ↓
Customer Agent
   ↓
LLM
   ↓
menu.get_availability
   ↓
Laravel
   ↓
MenuCatalogService
   ↓
StockService
   ↓
MySQL
   ↓
12 porsi
   ↓
LLM
   ↓
n8n
   ↓
WhatsApp
```

Response:

```text
"Masih kak 😊
Bubur Ayam tersedia 12 porsi.
Harganya Rp15.000."
```

---

# 33. Example: Create Order

Customer:

```text
"Saya pesan 2 bubur ayam."
```

Flow:

```text
LLM
 ↓
order.calculate
 ↓
Laravel
 ↓
Check stock
 ↓
Calculate price
 ↓
Return Rp30.000
```

AI:

```text
"Siap kak.
2 Bubur Ayam total Rp30.000.
Mau saya proses?"
```

Customer:

```text
"Ya."
```

Flow:

```text
LLM
 ↓
order.create
 ↓
Laravel
 ↓
Authorization
 ↓
Stock Check
 ↓
Price Calculation
 ↓
DB Transaction
 ↓
Order Created
 ↓
Stock Updated
 ↓
Payment Pending
```

---

# 34. Example: Owner Query

Owner:

```text
"Berapa penjualan hari ini?"
```

Flow:

```text
Owner
 ↓
n8n
 ↓
Owner Agent
 ↓
LLM
 ↓
owner.sales_summary
 ↓
Laravel
 ↓
Authorization
 ↓
Outlet Resolution
 ↓
SalesService
 ↓
MySQL
 ↓
Result
 ↓
LLM
 ↓
Owner
```

AI:

```text
"Penjualan hari ini:

Total transaksi : 84
Omzet           : Rp2.450.000
Produk terjual  : 167 item"
```

---

# 35. Human Takeover

Customer:

```text
"Saya mau bicara dengan admin."
```

Flow:

```text
n8n
 ↓
LLM
 ↓
human.handoff
 ↓
Laravel
 ↓
session.status = waiting_human
 ↓
Reverb
 ↓
Owner Dashboard
```

Owner:

```text
[Take Over]
```

Status:

```text
HUMAN_ACTIVE
```

AI tidak lagi membalas otomatis.

Setelah selesai:

```text
[Resume AI]
```

Status:

```text
AI_ACTIVE
```

---

# 36. Monitoring

Minimum monitoring:

```text
Laravel Telescope
Laravel Logs
n8n Execution History
AI Logs
Redis Monitoring
Reverb Monitoring
```

Metric penting:

```text
AI requests
AI success rate
AI error rate
Average latency
Token usage
Tool usage
Order conversion
Human handoff rate
Failed orders
```

---

# 37. Production Reliability

Implementasikan:

```text
Retry
Timeout
Rate Limiting
Circuit Breaker
Idempotency
Distributed Lock
Dead Letter Queue
Fallback Response
Human Handoff
Health Check
Audit Log
```

Critical path:

```text
WhatsApp
   ↓
n8n
   ↓
LLM
   ↓
Laravel
   ↓
POS
```

Setiap titik harus mempunyai timeout dan fallback.

---

# 38. Scalability

Arsitektur dapat diskalakan secara independen:

```text
                 ┌──────────────┐
                 │     n8n      │
                 │   Workers    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │     Redis    │
                 └──────┬───────┘
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
          Laravel 1 Laravel 2 Laravel 3
              │         │         │
              └─────────┼─────────┘
                        ▼
                     MySQL
```

Laravel tetap stateless untuk request AI.

Session state disimpan di:

```text
MySQL
Redis
```

bukan di memory process.

---

# 39. Development Phases

## Phase 1 — Foundation

```text
[ ] chat_sessions
[ ] chat_messages
[ ] AI logs
[ ] Redis
[ ] AI Gateway
[ ] n8n connection
```

## Phase 2 — Customer AI

```text
[ ] WhatsApp
[ ] Customer Agent
[ ] Groq
[ ] menu.get_catalog
[ ] menu.get_availability
[ ] menu.get_detail
```

## Phase 3 — Ordering

```text
[ ] order.calculate
[ ] order.create
[ ] order.detail
[ ] idempotency
[ ] transaction
[ ] stock validation
```

## Phase 4 — Owner AI

```text
[ ] Owner Agent
[ ] sales summary
[ ] stock summary
[ ] order summary
```

## Phase 5 — Human Handoff

```text
[ ] Take Over
[ ] Resume AI
[ ] Waiting Human
[ ] Owner notification
```

## Phase 6 — Reverb

```text
[ ] Chat events
[ ] Order events
[ ] AI events
[ ] Real-time dashboard
```

## Phase 7 — Production Hardening

```text
[ ] Rate limit
[ ] Retry
[ ] Timeout
[ ] Circuit breaker
[ ] Monitoring
[ ] Audit
[ ] Security testing
```

## Phase 8 — Multi Channel

```text
[ ] WhatsApp
[ ] Telegram
[ ] Web Chat
[ ] Instagram
[ ] Facebook
```

---

# 40. Seven Architecture Rules

## Rule 1

> **n8n bukan database POS.**

## Rule 2

> **LLM bukan sumber kebenaran harga, stok, order, atau payment.**

## Rule 3

> **Semua mutation POS harus melalui Laravel.**

## Rule 4

> **Authorization selalu dilakukan Laravel.**

## Rule 5

> **AI hanya mendapatkan data yang diperlukan.**

## Rule 6

> **Order dan payment harus transactional dan idempotent.**

## Rule 7

> **Semua aktivitas AI harus dapat diaudit.**

---

# 41. Final Architecture

```text
                         CHANNELS
        ┌──────────┬──────────┬──────────┐
        │ WhatsApp │ Telegram │ Web Chat │
        └────┬─────┴────┬─────┴────┬─────┘
             │          │          │
             └──────────┼──────────┘
                        ▼
                ┌─────────────────┐
                │       n8n       │
                │                 │
                │ AI Orchestrator │
                │ Session Routing │
                │ Tool Calling    │
                │ Retry           │
                │ Handoff         │
                └────────┬────────┘
                         │
                         ▼
                   ┌────────────┐
                   │    LLM     │
                   │   Groq     │
                   └─────┬──────┘
                         │
                     Tool Calls
                         │
                         ▼
              ┌──────────────────────┐
              │      Laravel 13      │
              │                      │
              │    AI Gateway        │
              │         ↓            │
              │    Authorization     │
              │         ↓            │
              │     AI Tools         │
              │         ↓            │
              │    POS Services      │
              │         ↓            │
              │   Business Rules     │
              └──────────┬───────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           MySQL       Redis      Reverb
              │                     │
              │                     ▼
              │               Owner Dashboard
              │
              ▼
          POS SOURCE
           OF TRUTH
```

---

# 42. Architecture Philosophy

Sistem ini dapat diringkas menjadi:

```text
┌─────────────────────────────────────┐
│             AI LAYER               │
│                                     │
│ n8n + LLM                           │
│                                     │
│ "Apa yang diminta user?"            │
└──────────────────┬──────────────────┘
                   │
                   │ Tool Call
                   ▼
┌─────────────────────────────────────┐
│          BUSINESS LAYER             │
│                                     │
│ Laravel 13                          │
│                                     │
│ "Apakah boleh dan bagaimana?"       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│            DATA LAYER               │
│                                     │
│ MySQL                               │
│                                     │
│ "Apa kondisi sebenarnya?"           │
└─────────────────────────────────────┘
```

### Kesimpulan

> **n8n = AI Operating Layer**
> **LLM = Reasoning Layer**
> **Laravel = Business Operating Layer**
> **MySQL = Source of Truth**
> **Redis = Performance & Reliability Layer**
> **Reverb = Real-Time Layer**

Dengan arsitektur ini, LWS-POS tidak menjadi tergantung pada n8n atau model AI tertentu. Jika suatu hari n8n diganti, Groq diganti, atau AI Agent dipindahkan ke service lain, **core POS Laravel tetap dapat berjalan tanpa perubahan fundamental**.
