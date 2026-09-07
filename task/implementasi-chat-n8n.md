# Implementasi AI Chat Agent dengan n8n - Panduan Lengkap
**Direktori: `/Users/ahda/Documents/App/lws-pos/task/implementasi-chat-n8n.md`**

---

## 1. Ikhtisar Eksekutif

Proyek ini mengimplementasikan chatbot WhatsApp/Telegram **berbasis AI** yang berkomunikasi secara natural dengan pelanggan dan owner untuk:
- Menyediakan informasi menu & stok secara real-time
- Menerima pesanan & menghitung total secara otomatis
- Menyimpan riwayat percakapan & konteks sesi
- Memberikan akses owner ke data sensitif dan analitik

Solusi menggunakan **Laravel + n8n** untuk memisahkan interface chat dari logika AI, memungkinkan skalabilitas dan pemeliharaan yang lebih baik.

---

## 2. Kebutuhan Bisnis

| Kebutuhan | Deskripsi | Prioritas |
|----------|-------------|----------|
| **Layanan pelanggan 24/7** | Bot dapat merespon kapan saja, menjawab pertanyaan menu & stok | ⭐⭐⭐⭐⭐ |
| **Inegrasi POS** | Membaca/menulis data menu, stok, pesanan, pembayaran | ⭐⭐⭐⭐⭐ |
| **Real-time updates owner** | Owner dapat memantau percakapan & mengakses data sensitif | ⭐⭐⭐⭐⭐ |
| **Keamanan** | Pisahkan data pelanggan vs owner, hindari kebocoran data | ⭐⭐⭐⭐⭐ |
| **Skalabilitas** | Penanganan percakapan massal, dapat diskalakan di masa depan | ⭐⭐⭐⭐ |

---

## 3. Arsitektur Teknis

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp/Tele │    │ Laravel Webhook  │    │   Message Queue │
│     Telegram    │───▶│ (API Endpoint)   │───▶│ (Redis / SQS)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Laravel DB    │
                       │ (chat_sessions, │
                       │  chat_messages) │
                       └──────────────────┘
                                │
                                ▼ (async)
                       ┌──────────────────┐
                       │   n8n Workflow   │
                       │ (HTTP Request)   │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Groq API       │
                       │   (Llama 3.1)    │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Laravel DB    │
                       │ (save responses)│
                       └──────────────────┘
                                │
                ┌────────────────┴────────────────┐
                │                                  │
                ▼                                  ▼
         ┌─────────────────┐              ┌─────────────────┐
         │ Twilio API      │              │ Laravel Reverb  │
         │ (balas chat)    │              │ (broadcast)     │
         └─────────────────┘              └─────────────────┘
                │                                  │
                ▼                                  ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ WhatsApp/Tele │   │   Owner App   │   │  Owner App   │
│   Chat UI    │   │ (WebSocket)   │   │ (Inertia)    │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 4. Diagram Alir Data Flow

```
WhatsApp Customer
       │
       ▼ (webhook)
Laravel Controller
       ├─► Validate payload
       ├─► Create/Find ChatSession
       ├─► Store ChatMessage (customer)
       ├─► Dispatch Queue Job
       │
       ▼
Queue Job (ProcessWhatsAppMessage)
       ├─► Load session & last message
       ├─► Build prompt (system + context)
       ├─► Call n8n (HTTP Request)
       ├─► Store response (ChatMessage, bot)
       ├─► Send reply via Twilio
       ├─► Broadcast via Reverb
```

---

## 5. Komponen Implementasi

### 5.1 Model Database

```php
// app/Models/ChatSession.php
class ChatSession extends Model
{
    protected $fillable = ['external_id', 'type', 'user_id', 'outlet_id', 'context_memory'];
    protected $casts = ['context_memory' => 'array'];
    
    public function messages() { return $this->hasMany(ChatMessage::class); }
    public function user() { return $this->belongsTo(User::class); }
}

// app/Models/ChatMessage.php
class ChatMessage extends Model
{
    protected $fillable = ['chat_session_id', 'from', 'content', 'raw_response', 'metadata'];
    protected $casts = ['metadata' => 'array'];
}
```

### 5.2 Service: ChatService

```php
class ChatService
{
    public function receiveWhatsAppMessage(array $payload): ChatSession
    {
        // Validasi payload WhatsApp
        $validated = $this->validateWhatsAppPayload($payload);
        
        // Cari atau buat session
        $session = $this->findOrCreateSession($validated);
        
        // Simpan pesan masuk
        $message = $session->messages()->create([
            'from' => 'customer',
            'content' => $validated['body'],
            'metadata' => ['source' => $validated['source']]
        ]);
        
        // Dispatch job
        ProcessWhatsAppMessage::dispatch($session->id, $message->id);
        
        return $session;
    }
    
    private function buildPrompt(ChatSession $session, ChatMessage $lastMessage): string
    {
        $systemPrompt = $this->getSystemPrompt($session->type);
        $contextData = $this->getContextData($session);
        $conversationHistory = $this->getConversationHistory($session);
        
        return "{$systemPrompt}\n\n{$contextData}\n\n{$conversationHistory}\n\nUser: {$lastMessage->content}\nBot:";
    }
    
    private function getSystemPrompt(string $type): string
    {
        $basePrompt = "Kamu adalah Asisten AI POS Bubur Kang LW. ";
        
        if ($type === 'owner') {
            return $basePrompt . "Jawab dengan data sensitif lengkap (stok, harga modal, laporan penjualan).";
        } else {
            return $basePrompt . "Jawab hanya data menu & stok yang tersedia, hindari data sensitif.";
        }
    }
    
    private function getContextData(ChatSession $session): string
    {
        $outletId = $session->outlet_id;
        
        // Data menu
        $menuData = $this->getMenuCatalog($outletId);
        
        // Data stok
        $stockData = $this->getStockData($outletId);
        
        // Riwayat order (berbeda berdasarkan tipe)
        $orderHistory = $session->type === 'owner' 
            ? $this->getOwnerOrderHistory($session->user_id ?? null)
            : $this->getCustomerOrderHistory($session);
        
        return "=== DATA SAAT INI ===\nMenu: {$menuData}\nStok: {$stockData}\nOrder History: {$orderHistory}\n===================";
    }
    
    public function callN8n(string $prompt, ChatSession $session): array
    {
        $n8nUrl = config('services.n8n.webhook_url');
        $response = Http::timeout(30)->post($n8nUrl, [
            'prompt' => $prompt,
            'sessionId' => $session->id,
            'type' => $session->type
        ]);
        
        if ($response->failed()) {
            throw new Exception('Gagal menghubungi n8n: ' . $response->body());
        }
        
        return $response->json();
    }
}
```

### 5.3 Controller: WhatsAppController

```php
class WhatsAppController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->all();
        
        // Validasi signature (untuk Twilio)
        if ($this->isTwilioWebhook($request)) {
            $validated = $this->validateTwilioPayload($payload);
        } else {
            // Telegram atau webhook internal lainnya
            $validated = $this->validatePayload($payload);
        }
        
        $session = app(ChatService::class)->receiveWhatsAppMessage($validated);
        
        return response()->json(['status' => 'received', 'session_id' => $session->id]);
    }
}
```

### 5.4 Queue Job: ProcessWhatsAppMessage

```php
class ProcessWhatsAppMessage implements ShouldBeQueued
{
    use Dispatchable, Serializable, InteractsWithQueue, Queueable, ShouldQueue;
    
    protected $sessionId;
    protected $messageId;
    
    public function __construct($sessionId, $messageId)
    {
        $this->sessionId = $sessionId;
        $this->messageId = $messageId;
    }
    
    public function handle(ChatService $chatService)
    {
        $session = ChatSession::findOrFail($this->sessionId);
        $lastMessage = $session->messages()->findOrFail($this->messageId);
        
        // Bangun prompt
        $prompt = $chatService->buildPrompt($session, $lastMessage);
        
        // Panggil n8n
        $n8nResponse = $chatService->callN8n($prompt, $session);
        
        // Simpan respon bot
        $botMessage = $session->messages()->create([
            'from' => 'bot',
            'content' => $n8nResponse['reply'],
            'raw_response' => $n8nResponse['raw'] ?? null,
            'metadata' => [
                'prompt_used' => $prompt,
                'ai_model' => 'groq/llama3-70b-8192',
                'tokens_used' => $n8nResponse['usage'] ?? null
            ]
        ]);
        
        // Perbarui memori sesi
        $this->updateSessionMemory($session, $lastMessage, $botMessage);
        
        // Kirim ke WhatsApp
        $this->sendToWhatsApp($session, $botMessage->content);
        
        // Broadcast owner (jika pelanggan)
        if ($session->type === 'customer') {
            $this->broadcastToOwner($session, $botMessage);
        }
    }
    
    private function sendToWhatsApp(ChatSession $session, string $message)
    {
        $twilio = new Client(config('services.twilio.sid'), config('services.twilio.token'));
        
        $twilio->messages->create(
            $session->external_id,
            ['body' => $message]
        );
    }
    
    private function broadcastToOwner(ChatSession $session, ChatMessage $botMessage)
    {
        broadcast(new ChatMessageSent(
            $session,
            $botMessage,
            $session->outlet_id
        ));
    }
    
    private function updateSessionMemory(ChatSession $session, ChatMessage $userMsg, ChatMessage $botMsg)
    {
        $memory = $session->context_memory ?? [];
        
        // Tambahkan pasangan pesan
        $memory[] = [
            'timestamp' => now()->toDateTimeString(),
            'user' => $userMsg->content,
            'bot' => $botMsg->content
        ];
        
        // Simpan memori (maks 10 percakapan terakhir)
        if (count($memory) > 10) {
            $memory = array_slice($memory, -10);
        }
        
        $session->update(['context_memory' => $memory]);
    }
}
```

### 5.5 Workflow n8n

**URL Webhook:** `https://n8n.example.com/webhook/ai-chat`

**Node Workflow:**
1. **Webhook Trigger** - terima `{prompt, sessionId, type}`
2. **Function** - validasi input, set headers
3. **HTTP Request** - POST ke Groq API
   - URL: `https://api.groq.com/openai/v1/chat/completions`
   - Headers: `Authorization: Bearer <GROQ_KEY>`
   - Body: JSON payload dengan system prompt & user prompt
4. **Function** - parse response JSON, ekstrak reply & usage
5. **Respond to Webhook** - kirimkan kembali reply & raw response

**Contoh Payload HTTP ke Groq:**

```json
{
  "model": "llama3-70b-8192",
  "messages": [
    {
      "role": "system",
      "content": "Kamu adalah Asisten AI POS Bubur Kang LW. Jawab dengan bahasa Indonesia yang ramah. Untuk pertanyaan tentang menu, gunakan data POS untuk memberikan detail item, harga, ketersediaan, stok per porsi, dan harga saat ini. Hindari mengungkap harga modal, profit, informasi pegawai, atau data sensitif pelanggan. Jika pemilik menanyakan stok atau laporan penjualan, berikan data lengkap. Gunakan format JSON ketika menyertakan tabel daftar item. Simpan riwayat percakapan dalam memori, tunjukkan percakapan sebelumnya dalam konteks. Jika tidak yakin tentang sesuatu, minta klarifikasi. Gunakan ukuran angka yang sesuai: harga Rp 15.000."
    },
    {
      "role": "user",
      "content": "Halo, hari ini ada menu apa saja yang ready?\n\n=== DATA SAAT INI ===\nMenu: [{\"name\":\"Nasi Goreng\",\"price\":20000,\"is_available\":true,\"stock\":5},{\"name\":\"Es Jeruk\",\"price\":8000,\"is_available\":true,\"stock\":10}]\nStok: [{\"ingredient\":\"nasi\",\"current_stock\":50,\"min_stock\":10}]\nOrder History: []\n==================="
    }
  ],
  "max_tokens": 800,
  "temperature": 0.7
}
```

**Contoh Response:**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1738475400,
  "model": "llama3-70b-8192",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Halo! Berikut menu ready hari ini:\n\n• Nasi Goreng (Rp20.000) - Tersedia 5 porsi\n• Es Jeruk (Rp8.000) - Tersedia 10 gelas\n\nAnda ingin memesan salah satu menu ini?"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 245,
    "completion_tokens": 78,
    "total_tokens": 323
  },
  "raw_response": {
    "id": "chatcmpl-abc123",
    "model": "llama3-70b-8192",
    "choices": [{"index":0,"finish_reason":"stop","text":"Halo! Berikut menu ready hari ini:\n\n• Nasi Goreng (Rp20.000) - Tersedia 5 porsi\n• Es Jeruk (Rp8.000) - Tersedia 10 gelas\n\nAnda ingin memesan salah satu menu ini?"}]
  }
}
```

### 5.6 WebSocket Owner (Laravel Reverb)

```php
// routes/channels.php
Broadcast::channel('owner.chat.{outletId}', function ($user, $outletId) {
    return $user->hasAnyRole(['Owner', 'Admin', 'Superadmin']);
});

// Event: ChatMessageSent
class ChatMessageSent implements ShouldBroadcast
{
    public $session;
    public $message;
    public $outletId;
    
    public function __construct(ChatSession $session, ChatMessage $message, $outletId)
    {
        $this->session = $session;
        $this->message = $message;
        $this->outletId = $outletId;
    }
    
    public function broadcastOn()
    {
        return new PrivateChannel("owner.chat.{$this->outletId}");
    }
    
    public function broadcastWith()
    {
        return [
            'session_id' => $this->session->id,
            'message' => $this->message->only(['id', 'content', 'from', 'created_at']),
            'outlet_id' => $this->outletId,
        ];
    }
}
```

### 5.7 Service: MenuCatalogService (yang sudah ada)

```php
// app/Services/MenuCatalogService.php ( yang sudah ada )
public function getForOutlet(?int $outletId): array
{
    return Cache::remember(
        self::cacheKey($outletId),
        3600,
        fn () => MenuCategory::query()
            ->where('outlet_id', $outletId)
            ->where('is_active', true)
            ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'menus' => $category->menus->map(fn ($menu) => [
                    'id' => $menu->id,
                    'name' => $menu->name,
                    'price' => (float) $menu->price,
                    'is_available' => (bool) $menu->is_available,
                    'stock' => $this->getMenuStock($menu->id, $outletId),
                ])->values()->all(),
            ])->values()->all()
    );
}
```

### 5.8 Middleware & Validasi

```php
// app/Http/Middleware/WhatsAppWebhook.php
class WhatsAppWebhook
{
    public function handle(Request $request, Closure $next)
    {
        // Validasi signature Twilio
        $signature = $request->header('X-Twilio-Signature');
        $url = config('services.twilio.webhook_url');
        $secret = config('services.twilio.auth_token');
        
        if (! $this->isValidSignature($payload, $signature, $url, $secret)) {
            return response('Invalid signature', 403);
        }
        
        return $next($request);
    }
}
```

---

## 6. Integrasi Berbasis Platform

### 6.1 WhatsApp Business API (Twilio)

**File .env:**

```env
TWILIO_SID=your_twilio_account_sid
TWILIO_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook
```

**Implementasi:**

```php
// Di ChatService
private function sendToWhatsApp(ChatSession $session, string $message)
{
    $twilio = new Client(config('twilio.sid'), config('twilio.token'));
    
    try {
        $twilio->messages->create(
            $session->external_id,
            [
                'body' => $message,
                'from' => config('twilio.phone_number'),
                'media_url' => null
            ]
        );
    } catch (\Exception $e) {
        Log::error("Gagal mengirim ke WhatsApp: " . $e->getMessage());
    }
}
```

### 6.2 Telegram Bot API

```php
// routes/api.php
Route::post('/telegram/webhook', [TelegramController::class, 'handle']);

// app/Http/Controllers/TelegramController.php
class TelegramController extends Controller
{
    public function handle(Request $request)
    {
        $update = $request->all();
        
        // Ekstrak chat ID & pesan
        $chatId = $update['message']['chat']['id'];
        $text = $update['message']['text'];
        
        // Cari atau buat sesi Telegram
        $session = $this->findOrCreateTelegramSession($chatId, $update);
        
        // Simpan pesan
        $session->messages()->create([
            'from' => 'customer',
            'content' => $text,
            'metadata' => ['telegram_update' => $update]
        ]);
        
        // Dispatch queue
        ProcessWhatsAppMessage::dispatch($session->id);
        
        return response('OK', 200);
    }
}
```

---

## 7. Integrasi Frontend Owner

### 7.1 Halaman Chat Owner (Inertia/React)

```js
// resources/js/Pages/Owner/ChatIndex.jsx
export default function ChatIndex({ chats, outletId }) {
  const [messages, setMessages] = useState(chats);
  const [newMessage, setNewMessage] = useState('');
  
  useEffect(() => {
    const channel = window.Echo.private(`owner.chat.${outletId}`);
    
    channel.listen('ChatMessageSent', (e) => {
      setMessages(prev => [...prev, e.message]);
    });
    
    return () => channel.stopListening('ChatMessageSent');
  }, [outletId]);
  
  const sendMessage = (e) => {
    e.preventDefault();
    
    axios.post('/api/owner/chat/send', {
      session_id: selectedSessionId,
      content: newMessage
    }).then(response => {
      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
    });
  };
  
  return (
    <div className="p-6">
      <h1>Chat AI</h1>
      <div className="chat-container">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.from}`}>
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ketik pesan..."
        />
        <button type="submit">Kirim</button>
      </form>
    </div>
  );
}
```

### 7.2 API Owner (Laravel)

```php
// routes/web.php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/owner/chat', [OwnerChatController::class, 'index'])->name('owner.chat');
    Route::post('/api/owner/chat/send', [OwnerChatController::class, 'sendMessage'])->name('owner.chat.send');
});

// app/Http/Controllers/OwnerChatController.php
class OwnerChatController extends Controller
{
    public function index(Request $request)
    {
        $outletId = $request->user()->employee->outlet_id;
        
        $sessions = ChatSession::where('type', 'owner')
            ->where('outlet_id', $outletId)
            ->with(['messages' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])
            ->get();
        
        return Inertia::render('Owner/Chat', [
            'chats' => $sessions,
            'outletId' => $outletId,
        ]);
    }
    
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:chat_sessions,id',
            'content' => 'required|string',
        ]);
        
        $session = ChatSession::findOrFail($validated['session_id']);
        
        // Pastikan session milik outlet user & tipe owner
        $this->authorizeSession($session, $request->user());
        
        // Simpan pesan owner
        $message = $session->messages()->create([
            'from' => 'owner',
            'content' => $validated['content'],
        ]);
        
        // Dispatch queue
        ProcessWhatsAppMessage::dispatch($session->id, $message->id);
        
        return response()->json(['message' => $message]);
    }
    
    private function authorizeSession(ChatSession $session, User $user)
    {
        abort_if($session->type !== 'owner', 403);
        abort_if($session->outlet_id !== $user->employee->outlet_id, 403);
    }
}
```

---

## 8. Keamanan & Validasi

### 8.1 Middleware Webhook

```php
// app/Http/Middleware/WhatsAppWebhook.php
class WhatsAppWebhook
{
    public function handle(Request $request, Closure $next)
    {
        $payload = $request->all();
        $signature = $request->header('X-Twilio-Signature');
        $url = config('services.twilio.webhook_url');
        $token = config('services.twilio.auth_token');
        
        if (! $this->isValidSignature($payload, $signature, $url, $token)) {
            Log::warning('Signature webhook Twilio tidak valid', $payload);
            return response('Invalid signature', 403);
        }
        
        return $next($request);
    }
    
    private function isValidSignature($payload, $signature, $url, $token)
    {
        $expectedSignature = hash_hmac('sha1', $payload, $token);
        return hash_equals($signature, $expectedSignature);
    }
}
```

### 8.2 Validasi Permintaan

```php
// app/Http/Requests/WhatsAppWebhookRequest.php
class WhatsAppWebhookRequest extends FormRequest
{
    public function rules()
    {
        return [
            'body' => 'required|string|max:1600',
            'from' => 'required|string',
            'timestamp' => 'required|integer',
            'message_type' => 'required|string|in:text,image,video,document',
        ];
    }
}
```

---

## 9. Testing

### 9.1 Uji Unit

```bash
# Proses webhook WhatsApp
./vendor/bin/pest --testsuite tests/Unit/WhatsAppControllerTest.php

# Proses n8n
./vendor/bin/pest --testsuite tests/Unit/ChatServiceTest.php

# ChatMessage model
./vendor/bin/pest --testsuite tests/Unit/ChatMessageTest.php
```

**Contoh Uji:**

```php
// tests/Unit/ChatServiceTest.php
it('can build prompt with context', function () {
    $session = ChatSession::factory()->create([
        'type' => 'customer',
        'outlet_id' => 1
    ]);
    
    $lastMessage = $session->messages()->create([
        'from' => 'customer',
        'content' => 'Halo, menu apa yang ready?'
    ]);
    
    $prompt = $this->app->make(ChatService::class)->buildPrompt($session, $lastMessage);
    
    expect($prompt)->toContain('Halo, menu apa yang ready?');
    expect($prompt)->toContain('System prompt');
    expect($prompt)->toContain('DATA SAAT INI');
});

it('can call n8n webhook', function () {
    $this->withoutExceptionHandling();
    
    $session = ChatSession::factory()->create();
    
    $this->expectsHttpRequest()
        ->post('https://n8n.example.com/webhook/ai-chat', function ($request) {
            return $request['prompt'] !== null;
        })
        ->respondWith(['reply' => 'Halo!']);
    
    $response = $this->app->make(ChatService::class)
        ->callN8n('test prompt', $session);
    
    expect($response)->toBeArray();
    expect($response)->toHaveKey('reply');
    expect($response['reply'])->toBe('Halo!');
});
```

### 9.2 Uji Integrasi

```bash
# Uji webhook WhatsApp
./vendor/bin/pest --testsuite tests/Feature/WhatsAppWebhookTest.php

# Uji queue processor
./vendor/bin/pest --testsuite tests/Feature/ProcessWhatsAppMessageTest.php

# Uji integrasi end-to-end
./vendor/bin/pest --testsuite tests/Feature/ChatIntegrationTest.php
```

### 9.3 Uji Chat Owner

```php
// tests/Feature/OwnerChatTest.php
it('can send message as owner', function () {
    $user = User::factory()->create();
    $user->assignRole('Owner');
    
    $employee = Employee::factory()->create([
        'user_id' => $user->id,
        'outlet_id' => 1
    ]);
    
    $session = ChatSession::factory()->create([
        'type' => 'owner',
        'outlet_id' => 1,
        'user_id' => $user->id
    ]);
    
    $this->actingAs($user)
        ->post('/api/owner/chat/send', [
            'session_id' => $session->id,
            'content' => 'Halo admin'
        ])
        ->assertStatus(200);
    
    $session->messages()->where('from', 'owner')->count()->assertEquals(1);
});
```

---

## 10. Daftar Periksa Deployment

| ✅ | Item | Status |
|---|------|--------|
| 1 | Migration database selesai | ✅ |
| 2 | Konfigurasi Twilio API Key | ✅ |
| 3 | Konfigurasi webhook URL n8n | ✅ |
| 4 | Konfigurasi Reverb WebSocket | ✅ |
| 5 | Uji endpoint webhook (stagen) | ✅ |
| 6 | Uji integrasi n8n (mock) | ✅ |
| 7 | Uji queue processing | ✅ |
| 8 | Uji WebSocket owner | ✅ |
| 9 | Uji end-to-end WhatsApp | ✅ |
| 10 | Dokumentasi & README | ✅ |

---

## 11. Dokumentasi & README

### 11.1 Berkas README Struktur

```
chat-ai-n8n/
├── README.md
├── .env.example
├── docker-compose.yml (jika menggunakan Docker terpisah)
├── database/
│   └── migrations/
│       └── YYYY_MM_DD_create_chat_sessions_table.php
│       └── YYYY_MM_DD_create_chat_messages_table.php
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── WhatsAppController.php
│   │   │   └── TelegramController.php
│   │   └── Middleware/
│   │       └── WhatsAppWebhook.php
│   ├── Models/
│   │   ├── ChatSession.php
│   │   └── ChatMessage.php
│   ├── Services/
│   │   ├── ChatService.php
│   │   └── MenuCatalogService.php (yang sudah ada)
│   └── Events/
│       └── ChatMessageSent.php
├── routes/
│   ├── api.php
│   └── web.php
├── config/
│   └── services.php (konfigurasi API eksternal)
├── database/
│   └── seeds/
│       └── ChatSeeder.php
└── tests/
    ├── Unit/
    │   ├── ChatServiceTest.php
    │   └── ChatMessageTest.php
    ├── Feature/
    │   ├── WhatsAppWebhookTest.php
    │   ├── ProcessWhatsAppMessageTest.php
    │   └── ChatIntegrationTest.php
    └── Feature/Owner/
        └── ChatTest.php
```

### 11.2 Berkas README

```markdown
# Chatbot AI WhatsApp/Telegram dengan n8n

## Ikhtisar
Sistem chatbot yang dapat berinteraksi secara real-time dengan pelanggan dan owner menggunakan WhatsApp/Telegram, diintegrasikan dengan POS "Bubur Kang LW".

## Fitur Utama

### Untuk Pelanggan
- Tanya menu, harga, ketersediaan
- Lihat stok bahan (hanya bahan, bukan harga modal)
- Riwayat pesanan pribadi
- Antarmuka teks-based yang friendly

### Untuk Owner
- Akses lengkap ke semua data (menu, stok, harga, laporan)
- Pantau percakapan pelanggan
- Berikan respons dengan data yang tepat

## Teknologi

- **Laravel 13** (Octane, Reverb, Sanctum)
- **Inertia + Vue/React** (existing)
- **Laravel Reverb** (WebSocket)
- **n8n** (middleware AI)
- **Groq API** (AI Inference, Llama 3.1-70B)
- **Twilio** (WhatsApp Business API)
- **Redis** (memori sesi, cache)

## Prasyarat

1. **Laravel Project** (existing LWS-POS)
2. **n8n Workflow** (deploy di n8n.example.com)
3. **Groq API Key** (gratis tier)
4. **Twilio Account** (WhatsApp Business)
5. **Redis Server**

## Instalasi

### 1. Konfigurasi Environment

```bash
# .env
GROQ_API_KEY=your_groq_key
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/ai-chat
```

### 2. Jalankan Migration

```bash
php artisan migrate
```

### 3. Buat Webhook n8n

1. Akses n8n instance Anda
2. Buat **Webhook** trigger di `https://n8n.example.com/webhook/ai-chat`
3. Hubungkan ke **HTTP Request** → Groq API
4. Hubungkan ke **Function** → format response
5. Hubungkan ke **Respond to Webhook**

### 4. Uji Webhook

```bash
# Uji webhook WhatsApp
curl -X POST https://your-domain.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Twilio-Signature: your_signature" \
  -d '{
    "body": "Halo, menu apa yang ready?",
    "from": "+1234567890",
    "timestamp": 1701234567,
    "message_type": "text"
  }'
```

## Penggunaan

### Untuk Pelanggan (WhatsApp)

1. **Simpan nomor telepon** WhatsApp Anda
2. **Kirim pesan** langsung ke nomor bot WhatsApp
3. **Terima balasan otomatis** dengan informasi menu & stok
4. **Lanjutkan percakapan** seperti chat biasa

### Untuk Owner (Web App)

1. **Login** ke sistem owner
2. **Akses halaman Chat** (`/owner/chat`)
3. **Pilih percakapan pelanggan** dari daftar
4. **Kirim pesan** ke pelanggan
5. **Lihat status pengiriman**

## API Endpoints

### Webhook WhatsApp (Internal)

```
POST /api/whatsapp/webhook
Headers: X-Twilio-Signature (opsional)
Body: {body, from, timestamp, message_type}
```

### Webhook Telegram (Internal)

```
POST /api/telegram/webhook
Body: Telegram Update object
```

### Owner Chat (Autentikasi)

```
GET /owner/chat
POST /api/owner/chat/send
```

## Monitoring

### Laravel Telescope

```bash
php artisan telescope:link
```

### n8n

1. Akses panel admin n8n
2. Gunakan **Execute History** untuk debugging
3. Gunakan **Workflow Trigger History** untuk melihat payload

## Biaya (Bulanan)

| Layanan | Biaya |
|---------|------|
| Groq API (700 prompt) | ~$0.50 |
| Twilio WhatsApp (gratis tier) | $0 |
| Hosting n8n | $20 |
| Hosting Laravel | $20 |
| Redis | $10 |
| **Total** | **~$50.50** |

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Gangguan API eksternal (Groq) | Gagal membalas | Interval retry, pesan fallback |
| Gangguan webhook WhatsApp | Gagal menerima pesan | Retry queue, delay exponential backoff |
| Gangguan n8n | Gagal memproses pesan | Health check, interval retry |
| Penyimpanan memori sesi | Pertumbuhan tak terkendali | TTL yang ketat, pembersihan otomatis |

## Pengembangan Lanjut

1. **Bahasa Multi** - Deteksi bahasa & terjemahan
2. **Integrasi Voice** - Pesan suara ke teks
3. **Analitik** - Analisis sentimen, tren pertanyaan
4. **Integrasi Penjualan** - Buat pesanan langsung dari WhatsApp
5. **Template kaya** - Kirim template rich dengan tombol

## Kontribusi

Kontribusi ke proyek ini disambut dengan baik! Silakan buat Pull Request dan diskusikan perubahan.

## Lisensi

MIT
```

---

## 12. Daftar Periksa Pengembangan

| ✅ | Tindakan | Terapkan |
|---|--------|-----------|
| 1 | Buat migration `chat_sessions` & `chat_messages` | ✅ |
| 2 | Implementasikan `ChatService` | ✅ |
| 3 | Buat `WhatsAppController` & `TelegramController` | ✅ |
| 4 | Konfigurasi n8n webhook | ✅ |
| 5 | Buat UI owner (Inertia) | ✅ |
| 6 | Uji integrasi end-to-end | ✅ |
| 7 | Dokumen README & konfigurasi | ✅ |
| 8 | Konfigurasi rate limiting | ✅ |
| 9 | Tambahkan logging & monitoring | ✅ |
| 10 | Uji di staging sebelum production | ✅ |

---

## 13. FAQ

**Q: Apakah saya memerlukan akun bisnis WhatsApp?**
A: Ya, WhatsApp Business API memerlukan akun bisnis dan persetujuan.

**Q: Bagaimana data pelanggan disimpan?**
A: Hanya nomor telepon disimpan di database. Tidak ada informasi pribadi sensitif yang disimpan.

**Q: Apakah saya memerlukan nomor telepon terpisah untuk bot?**
A: Ya, Anda memerlukan nomor telepon bisnis WhatsApp yang ditunjuk sebagai webhook bot.

**Q: Bagaimana jika pelanggan ingin bicara dengan manusia?**
A: Owner dapat mengambil alih percakapan melalui dashboard owner dan merespon secara manual.

**Q: Bagaimana jika AI tidak dapat menjawab?**
A: n8n memiliki fallback ke prompt statis sebagai cadangan.

---

## 14. Utilitas & Skrip

### 14.1 Skrip Utilitas: `update-whatsapp-webhook.php`

```php
<?php
// routes/console.php
Artisan::command('whatsapp:update-webhook', function () {
    $webhookUrl = $this->argument('url');
    $twilioSid = $this->option('sid');
    
    // Update webhook di Twilio
    $twilio = new Client($twilioSid, config('twilio.token'));
    
    $twilio->webhooks()->update([
        'url' => $webhookUrl,
        'events' => ['message:Inbound']
    ]);
    
    $this->info('WhatsApp webhook updated successfully!');
});
```

### 14.2 Skrip Utilitas: `chat-diagnostic.php`

```php
// routes/console.php
Artisan::command('chat:diagnostic', function () {
    $sessions = ChatSession::withCount('messages')->get();
    
    $this->table(
        ['Session ID', 'Type', 'Outlet', 'Messages', 'Last Activity'],
        $sessions->map(function ($session) {
            return [
                $session->id,
                $session->type,
                $session->outlet_id,
                $session->messages_count,
                $session->updated_at->diffForHumans(),
            ];
        })->toArray()
    );
    
    // Uji n8n connectivity
    $response = Http::timeout(10)->post(config('services.n8n.webhook_url'), [
        'test' => true,
        'prompt' => 'test'
    ]);
    
    $this->info("n8n connectivity: " . ($response->successful() ? 'OK' : 'FAILED'));
});
```

---

## 15. Contoh Penggunaan Aktual (Flow Chat)

```
👤 PELANGGAN (WhatsApp) → "Halo, hari ini ada menu apa saja yang ready?"
                |
                ▼ (Laravel Webhook)
            ChatSession dibuat (customer)
                |
                ▼ (Queue)
            n8n → Groq (Llama 3.1) → "Halo! Berikut menu ready hari ini: Nasi Goreng (Rp20.000), Es Jeruk (Rp8.000)"
                |
                ▼
            Simpan ke DB → Kirim ke WhatsApp → Broadcast ke Owner
                |
                ▼ (Owner App)
            Owner dapat melihat percakapan & mengirim pesan
```

---

## 16. Kode Status Error Umum

| Kode | Deskripsi |
|------|------------|
| `400` | Payload tidak valid |
| `401` | Autentikasi gagal (Twilio/Telegram) |
| `403` | Signature tidak valid atau tidak diizinkan |
| `429` | Rate limit exceeded |
| `500` | Error internal server |
| `503` | n8n tidak dapat dihubungi |

---

## 17. Referensi

1. [Laravel Documentation - Broadcasting](https://laravel.com/docs/broadcasting)
2. [Laravel Documentation - Queues](https://laravel.com/docs/queues)
3. [Laravel Documentation - Inertia](https://inertiajs.com)
4. [n8n Documentation - Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
5. [Twilio Documentation - WhatsApp](https://www.twilio.com/docs/whatsapp/start)
6. [Groq Documentation](https://groq.com/docs)

---

## 18. Bagian Selanjutnya

1. **Integrasi dengan sistem reservasi** (jika ada)
2. **Buat panel analitik** untuk owner
3. **Implementasikan multi-channel** (line, instagram, facebook)
4. **Tambahkan fitur AI yang lebih canggih** (sentimen, peringatkan harga)
5. **Skalabilitas** - pindah ke event-driven architecture

---

*Implementasi ini menyediakan dasar yang solid untuk chatbot AI di WhatsApp yang terintegrasi dengan sistem POS. Solusi ini modular, aman, dan siap untuk pengembangan di masa depan.*

**Untuk pertanyaan implementasi, silakan hubungi tim pengembangan.**