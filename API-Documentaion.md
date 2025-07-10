VITE_BASE_URL=https://naaf-food-server.vercel.app# NAAF Food Server API Documentation


## Authentication
All API endpoints require authentication using JWT (JSON Web Tokens). Include the token in the Authorization header:


## Endpoints

### Products

#### Get All Products
- **GET** `/products`
- **Access:** Admin, Moderator
- **Description:** Retrieve a list of all products

#### Create a Product
- **POST** `/products`
- **Access:** Admin
- **Description:** Create a new product
- **Body:** Multipart form-data
  - `product_image`: File
  - Other product details (TBD)

#### Get Product by ID
- **GET** `/products/:id`
- **Access:** Admin, Moderator
- **Description:** Retrieve a specific product by its ID

#### Update Product
- **PUT** `/products/:id`
- **Access:** Admin
- **Description:** Update an existing product

#### Delete Product
- **DELETE** `/products/:id`
- **Access:** Admin
- **Description:** Delete a product

### Orders

#### Get All Orders
- **GET** `/orders`
- **Access:** Admin, Moderator
- **Description:** Retrieve a list of all orders

#### Create an Order
- **POST** `/orders`
- **Access:** Admin, Moderator
- **Description:** Create a new order

#### Get Order by ID
- **GET** `/orders/:id`
- **Access:** Admin, Moderator
- **Description:** Retrieve a specific order by its ID

#### Update Order
- **PUT** `/orders/:id`
- **Access:** Admin, Moderator
- **Description:** Update an existing order

#### Delete Order
- **DELETE** `/orders/:id`
- **Access:** Admin
- **Description:** Delete an order

#### Dispatch Order to Steadfast
- **POST** `/orders/:id/dispatch`
- **Access:** Admin
- **Description:** Dispatch an order to Steadfast courier service

### Additional Endpoints

The following endpoints are likely to exist based on the project structure, but their exact implementation details are not visible in the provided code snippets:

- User management (registration, login, profile management)
- Follow-ups management
- Tasks management

## Error Handling

All endpoints will return appropriate HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Detailed error messages will be provided in the response body.

## Data Models

Detailed data models for Products, Orders, Users, Follow-ups, and Tasks should be added here.

## External Integrations

### Google Sheets
The application uses Google Sheets for data storage. Each entity (Users, Products, Orders, Follow-ups, Tasks) has its own sheet in the Google Spreadsheet.

### Steadfast Courier
Orders can be dispatched to Steadfast courier service for delivery.

## Notes

- This API documentation is based on the available code snippets and may not be exhaustive.
- Ensure all sensitive data (like API keys, credentials) are properly secured and not exposed in requests or responses.
- Implement proper input validation and sanitization for all endpoints to prevent security vulnerabilities.

index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

// Local Imports
import { initDoc } from './utils/googleSheets.js';
import authRoutes from './authentication/auth.routes.js';
import productRoutes from './products/products.routes.js';
import orderRoutes from './orders/orders.routes.js';
import taskRoutes from './tasks/tasks.routes.js';
import followUpRoutes from './follow-ups/follow_ups.routes.js';
import steadfastRoutes from './steadfast/steadfast.routes.js';
import { startCronJobs } from './cron/jobs.js';

// ✅ Check required ENV variables
const requiredEnvVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SHEET_ID',
    'BULKSMSBD_API_KEY',
    'BULKSMSBD_SENDER_ID',
    'PORT',
    'JWT_SCREECT_TOKEN',
    'IMGBB_API_KEY',
    'STEADFAST_API_KEY',
    'STEADFAST_SECRET_KEY',
    'Fraud_CHECKER_API_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing environment variable: ${envVar}`);
        throw new Error(`Missing environment variable: ${envVar}`);
    }
}

// ✅ Express setup
const app = express();

// Middlewares
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use(compression());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
}));

// ✅ Initialize Google Sheets connection on startup
initDoc().then(() => {
    // Start cron jobs only after sheets are initialized
    startCronJobs();
}).catch(err => console.error("Failed to initialize Google Sheets:", err));

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/steadfast', steadfastRoutes);

// ✅ Default route
app.get('/', (req, res) => {
    res.send('Naaf-food order systems API is running');
});

// ✅ Run server for local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// ✅ Export the app for Vercel
export default app;
