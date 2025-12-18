# 📘 VINCONS API DOCUMENTATION

## Base URL
```
https://your-domain.com/api/v1
```

## Authentication

All API requests require an API key in the header:

```bash
X-API-Key: your_api_key_here
```

---

## Endpoints

### **Machines**

#### List Machines
```http
GET /api/v1/machines
```

**Query Parameters:**
- `limit` (number, default: 100) - Number of results per page
- `offset` (number, default: 0) - Pagination offset
- `status` (string, optional) - Filter by status (active, maintenance, etc.)
- `project` (string, optional) - Filter by project name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "VC-001",
      "name": "Excavator 001",
      "model": "PC200",
      "brand": "Komatsu",
      "status": "active",
      "project_name": "Project A",
      "current_hours": 1250,
      "serial_number": "SN12345",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Get Single Machine
```http
GET /api/v1/machines/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "VC-001",
    // ... full machine object
  }
}
```

#### Create Machine
```http
POST /api/v1/machines
```

**Request Body:**
```json
{
  "code": "VC-001",
  "name": "Excavator 001",
  "model": "PC200",
  "brand": "Komatsu",
  "status": "active",
  "project_name": "Project A",
  "current_hours": 0,
  "serial_number": "SN12345"
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "data": {
    // created machine object
  }
}
```

#### Update Machine
```http
PUT /api/v1/machines/:id
```

**Request Body:** (partial update supported)
```json
{
  "current_hours": 1300,
  "status": "maintenance"
}
```

#### Delete Machine
```http
DELETE /api/v1/machines/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Machine deleted successfully"
}
```

---

### **Webhooks**

#### Register Webhook
```http
POST /api/v1/webhooks/register
```

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhook-handler",
  "events": ["machine.created", "machine.updated", "maintenance.scheduled"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://your-domain.com/webhook-handler",
    "secret": "whsec_xxx...",
    "events": ["machine.created"],
    "active": true
  }
}
```

**Available Events:**
- `machine.created`
- `machine.updated`
- `machine.deleted`
- `maintenance.scheduled`
- `maintenance.completed`
- `log.created`
- `alert.triggered`

**Webhook Payload:**
```json
{
  "event": "machine.created",
  "data": {
    // event data
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Webhook Headers:**
- `X-Webhook-Signature`: HMAC signature for verification
- `X-Webhook-Event`: Event type

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Machine code is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Machine not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Machine code already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

- **100 requests per minute** per API key
- Headers included in response:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: Unix timestamp

---

## Code Examples

### JavaScript/Node.js
```javascript
const axios = require('axios')

const apiClient = axios.create({
  baseURL: 'https://your-domain.com/api/v1',
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  }
})

// Get machines
const machines = await apiClient.get('/machines', {
  params: { limit: 10, status: 'active' }
})

// Create machine
const newMachine = await apiClient.post('/machines', {
  code: 'VC-001',
  name: 'Excavator 001',
  model: 'PC200'
})

// Update machine
await apiClient.put('/machines/uuid', {
  current_hours: 1300
})
```

### Python
```python
import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://your-domain.com/api/v1'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Get machines
response = requests.get(
    f'{BASE_URL}/machines',
    headers=headers,
    params={'limit': 10}
)
machines = response.json()

# Create machine
new_machine = requests.post(
    f'{BASE_URL}/machines',
    headers=headers,
    json={
        'code': 'VC-001',
        'name': 'Excavator 001'
    }
)
```

### cURL
```bash
# Get machines
curl -X GET 'https://your-domain.com/api/v1/machines?limit=10' \
  -H 'X-API-Key: your_api_key_here'

# Create machine
curl -X POST 'https://your-domain.com/api/v1/machines' \
  -H 'X-API-Key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "VC-001",
    "name": "Excavator 001",
    "model": "PC200"
  }'
```

---

## Webhook Verification

To verify webhook signatures in your endpoint:

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return signature === expectedSignature
}

// In your webhook handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const payload = req.body
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature')
  }
  
  // Process webhook
  console.log('Event:', payload.event)
  console.log('Data:', payload.data)
  
  res.status(200).send('OK')
})
```

---

## Best Practices

1. **Always verify webhook signatures**
2. **Handle rate limits gracefully with exponential backoff**
3. **Use HTTPS only**
4. **Store API keys securely (environment variables)**
5. **Implement proper error handling**
6. **Use pagination for large datasets**
7. **Cache responses when appropriate**

---

## Support

For API support or questions:
- Email: api@vincons.com
- Documentation: https://docs.vincons.com/api
