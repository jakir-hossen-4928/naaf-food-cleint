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
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sheets } from '../utils/googleSheets.js';

/**
 * Registers a new user.
 */
export const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            mobile_number,
            telegram_chat_id,
            bot_token,
            role = 'Moderator' // Default role to Moderator
        } = req.body;

        // Basic validation
        if (!email || !password || !name || !mobile_number) {
            return res.status(400).json({ message: 'Please provide all required fields: name, email, password, mobile_number.' });
        }

        const sheet = sheets.users;
        if (!sheet) {
            return res.status(500).json({ message: 'The "Users" sheet is not loaded. Please check server logs.' });
        }

        const rows = await sheet.getRows();
        const userExists = rows.some(row => row.get('email') === email);

        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create new user object
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password_hash,
            mobile_number,
            telegram_chat_id: telegram_chat_id || '',
            bot_token: bot_token || '',
            role,
            status: 'Active' // Default status to Active
        };

        await sheet.addRow(newUser);

        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

/**
 * Logs in a user.
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        const sheet = sheets.users;
        if (!sheet) {
            return res.status(500).json({ message: 'The "Users" sheet is not loaded. Please check server logs.' });
        }

        const rows = await sheet.getRows();
        const userRow = rows.find(row => row.get('email') === email);

        if (!userRow) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, userRow.get('password_hash'));

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        if (userRow.get('status') !== 'Active') {
            return res.status(403).json({ message: 'User account is not active.' });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: userRow.get('id'),
                email: userRow.get('email'),
                role: userRow.get('role')
            }
        };

        // Sign token
        jwt.sign(
            payload,
            process.env.JWT_SCREECT_TOKEN,
            { expiresIn: '7d' }, // Token expires in 7 days
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

import jwt from 'jsonwebtoken';

/**
 * Middleware to protect routes by verifying JWT.
 */
export const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SCREECT_TOKEN);

            // Attach user to the request object (excluding password)
            req.user = decoded.user;
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Middleware to authorize users based on their roles.
 * @param {...string} roles - The roles that are allowed to access the route.
 * @returns {function} Express middleware function.
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role '${req.user?.role}' is not authorized to access this route` });
        }
        next();
    };
};

import { Router } from 'express';
import { register, login } from './auth.controller.js';

const router = Router();

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', login);

export default router;

import { sheets } from '../utils/googleSheets.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new follow-up.
 */
export const createFollowUp = async (req, res) => {
    try {
        const {
            order_id,
            followup_date,
            notes
        } = req.body;

        if (!order_id || !followup_date) {
            return res.status(400).json({ message: 'Missing required fields: order_id, followup_date.' });
        }

        const sheet = sheets.followUps;
        const newFollowUp = {
            followup_id: uuidv4(),
            order_id,
            followup_date,
            notes: notes || '',
            status: 'Pending'
        };

        await sheet.addRow(newFollowUp);
        res.status(201).json({ message: 'Follow-up created successfully', followup: newFollowUp });

    } catch (error) {
        console.error('Create Follow-up Error:', error);
        res.status(500).json({ message: 'Server error while creating follow-up.' });
    }
};

/**
 * Get all follow-ups.
 * This is an admin-only action for now to see all follow-ups.
 * A more specific route might be needed for moderators to see follow-ups for their orders.
 */
export const getAllFollowUps = async (req, res) => {
    try {
        const sheet = sheets.followUps;
        const rows = await sheet.getRows();
        const followUps = rows.map(row => row.toObject());
        res.status(200).json(followUps);
    } catch (error) {
        console.error('Get All Follow-ups Error:', error);
        res.status(500).json({ message: 'Server error while fetching follow-ups.' });
    }
};

/**
 * Get a single follow-up by its ID.
 */
export const getFollowUpById = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.followUps;
        const rows = await sheet.getRows();
        const followUpRow = rows.find(row => row.get('followup_id') === id);

        if (!followUpRow) {
            return res.status(404).json({ message: 'Follow-up not found.' });
        }

        res.status(200).json(followUpRow.toObject());
    } catch (error) {
        console.error('Get Follow-up By ID Error:', error);
        res.status(500).json({ message: 'Server error while fetching follow-up.' });
    }
};

/**
 * Update a follow-up.
 */
export const updateFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.followUps;
        const rows = await sheet.getRows();
        const followUpRow = rows.find(row => row.get('followup_id') === id);

        if (!followUpRow) {
            return res.status(404).json({ message: 'Follow-up not found.' });
        }

        const fieldsToUpdate = ['followup_date', 'notes', 'status'];
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                followUpRow.set(field, req.body[field]);
            }
        });

        await followUpRow.save();
        res.status(200).json({ message: 'Follow-up updated successfully', followup: followUpRow.toObject() });

    } catch (error) {
        console.error('Update Follow-up Error:', error);
        res.status(500).json({ message: 'Server error while updating follow-up.' });
    }
};

/**
 * Delete a follow-up (Admin only).
 */
export const deleteFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.followUps;
        const rows = await sheet.getRows();
        const followUpRow = rows.find(row => row.get('followup_id') === id);

        if (!followUpRow) {
            return res.status(404).json({ message: 'Follow-up not found.' });
        }

        await followUpRow.delete();
        res.status(200).json({ message: 'Follow-up deleted successfully.' });
    } catch (error) {
        console.error('Delete Follow-up Error:', error);
        res.status(500).json({ message: 'Server error while deleting follow-up.' });
    }
};

import { Router } from 'express';
import {
    createFollowUp,
    getAllFollowUps,
    getFollowUpById,
    updateFollowUp,
    deleteFollowUp
} from './follow_ups.controller.js';
import { protect, authorize } from '../authentication/auth.middleware.js';

const router = Router();

// --- Follow-up Routes ---

router.route('/')
    // Getting all follow-ups is an Admin-only action for oversight
    .get(protect, authorize('Admin'), getAllFollowUps)
    .post(protect, authorize('Admin', 'Moderator'), createFollowUp);

router.route('/:id')
    .get(protect, authorize('Admin', 'Moderator'), getFollowUpById)
    .put(protect, authorize('Admin', 'Moderator'), updateFollowUp)
    .delete(protect, authorize('Admin'), deleteFollowUp); // Only Admins can delete

export default router;

import { sheets } from '../utils/googleSheets.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { createSingleOrder } from '../utils/steadfast.js';

/**
 * Generates the next sequential order ID (e.g., NF-001, NF-002).
 */
const generateNextOrderId = async (sheet) => {
    const rows = await sheet.getRows();
    if (rows.length === 0) {
        return 'NF-001';
    }
    const lastOrderId = rows[rows.length - 1].get('order_id');
    const lastIdNumber = parseInt(lastOrderId.split('-')[1], 10);
    const nextIdNumber = lastIdNumber + 1;
    return `NF-${String(nextIdNumber).padStart(3, '0')}`;
};

/**
 * Create a new order.
 */
export const createOrder = async (req, res) => {
    try {
        const {
            customer_name,
            mobile_number,
            email,
            address,
            notes,
            product_id,
            order_source,
            delivery_charge
        } = req.body;

        const moderator_id = req.user.id; // Get moderator ID from the authenticated user

        if (!customer_name || !mobile_number || !address || !product_id || !delivery_charge) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // --- Fraud Check --- //
        let fraud_result = {};
        try {
            const response = await axios.post('https://bdcourier.com/api/courier-check', 
                { phone: mobile_number }, 
                {
                    headers: { 'Authorization': `Bearer ${process.env.Fraud_CHECKER_API_KEY}` }
                }
            );
            fraud_result = response.data;
        } catch (fraudError) {
            console.error('Fraud Check API Error:', fraudError.message);
            // Decide if you want to block order creation on fraud check failure
            fraud_result = { error: 'Fraud check failed', message: fraudError.message };
        }

        const sheet = sheets.orders;
        const order_id = await generateNextOrderId(sheet);

        const newOrder = {
            order_id,
            id: uuidv4(),
            customer_name,
            mobile_number,
            email: email || '',
            address,
            moderator_id,
            notes: notes || '',
            product_id,
            order_source,
            fraud_result: JSON.stringify(fraud_result),
            delivery_charge,
            status: 'Pending-Moderator',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            steadfast_tracking_id: ''
        };

        await sheet.addRow(newOrder);
        res.status(201).json({ message: 'Order created successfully', order: newOrder });

    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ message: 'Server error while creating order.' });
    }
};

/**
 * Get all orders.
 * Admins see all orders.
 * Moderators see only their own orders.
 */
export const getAllOrders = async (req, res) => {
    try {
        const sheet = sheets.orders;
        const rows = await sheet.getRows();
        let orders = rows.map(row => row.toObject());

        // Filter for moderators
        if (req.user.role === 'Moderator') {
            orders = orders.filter(order => order.moderator_id === req.user.id);
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Get All Orders Error:', error);
        res.status(500).json({ message: 'Server error while fetching orders.' });
    }
};

/**
 * Get a single order by its ID.
 */
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.orders;
        const rows = await sheet.getRows();
        const orderRow = rows.find(row => row.get('id') === id);

        if (!orderRow) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Moderators can only access their own orders
        if (req.user.role === 'Moderator' && orderRow.get('moderator_id') !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden. You can only view your own orders.' });
        }

        res.status(200).json(orderRow.toObject());
    } catch (error) {
        console.error('Get Order By ID Error:', error);
        res.status(500).json({ message: 'Server error while fetching order.' });
    }
};

/**
 * Update an order.
 */
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.orders;
        const rows = await sheet.getRows();
        const orderRow = rows.find(row => row.get('id') === id);

        if (!orderRow) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Moderators can only update their own orders
        if (req.user.role === 'Moderator' && orderRow.get('moderator_id') !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden. You can only update your own orders.' });
        }

        const fieldsToUpdate = ['customer_name', 'mobile_number', 'email', 'address', 'notes', 'product_id', 'order_source', 'delivery_charge', 'status'];
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                orderRow.set(field, req.body[field]);
            }
        });
        orderRow.set('updated_at', new Date().toISOString());

        await orderRow.save();
        res.status(200).json({ message: 'Order updated successfully', order: orderRow.toObject() });

    } catch (error) {
        console.error('Update Order Error:', error);
        res.status(500).json({ message: 'Server error while updating order.' });
    }
};

/**
 * Delete an order (Admin only).
 */
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.orders;
        const rows = await sheet.getRows();
        const orderRow = rows.find(row => row.get('id') === id);

        if (!orderRow) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        await orderRow.delete();
        res.status(200).json({ message: 'Order deleted successfully.' });
    } catch (error) {
        console.error('Delete Order Error:', error);
        res.status(500).json({ message: 'Server error while deleting order.' });
    }
};

/**
 * Dispatches an order to Steadfast Courier (Admin only).
 */
export const dispatchOrderToSteadfast = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.orders;
        const productSheet = sheets.products;
        const rows = await sheet.getRows();
        const orderRow = rows.find(row => row.get('id') === id);

        if (!orderRow) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (orderRow.get('steadfast_tracking_id')) {
            return res.status(400).json({ message: 'Order already dispatched to Steadfast.' });
        }

        // Fetch product details for item_description
        const productRows = await productSheet.getRows();
        const product = productRows.find(p => p.get('id') === orderRow.get('product_id'));
        const item_description = product ? product.get('name') : 'Product';

        const steadfastOrderData = {
            invoice: orderRow.get('order_id'),
            recipient_name: orderRow.get('customer_name'),
            recipient_phone: orderRow.get('mobile_number'),
            recipient_email: orderRow.get('email'),
            recipient_address: orderRow.get('address'),
            cod_amount: parseFloat(orderRow.get('delivery_charge')) + parseFloat(orderRow.get('product_id') ? product.get('sales_price') : 0), // Assuming product_id refers to product and sales_price is relevant
            note: orderRow.get('notes'),
            item_description: item_description,
            total_lot: 1, // Assuming 1 item per order for now
            delivery_type: 0 // 0 for home delivery
        };

        const steadfastResponse = await createSingleOrder(steadfastOrderData);

        if (steadfastResponse.status === 200) {
            orderRow.set('steadfast_tracking_id', steadfastResponse.consignment.tracking_code);
            orderRow.set('status', steadfastResponse.consignment.status); // e.g., 'in_review'
            orderRow.set('updated_at', new Date().toISOString());
            await orderRow.save();
            res.status(200).json({ message: 'Order dispatched to Steadfast successfully', steadfastResponse });
        } else {
            res.status(400).json({ message: 'Failed to dispatch order to Steadfast', steadfastResponse });
        }

    } catch (error) {
        console.error('Dispatch Order to Steadfast Error:', error);
        res.status(500).json({ message: 'Server error while dispatching order to Steadfast.' });
    }
};
import { Router } from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    dispatchOrderToSteadfast
} from './orders.controller.js';
import { protect, authorize } from '../authentication/auth.middleware.js';

const router = Router();

// --- Order Routes ---

// Get all orders or create a new order
router.route('/')
    .get(protect, authorize('Admin', 'Moderator'), getAllOrders)
    .post(protect, authorize('Admin', 'Moderator'), createOrder);

// Routes for a single order by ID
router.route('/:id')
    .get(protect, authorize('Admin', 'Moderator'), getOrderById)
    .put(protect, authorize('Admin', 'Moderator'), updateOrder)
    .delete(protect, authorize('Admin'), deleteOrder); // Only Admins can delete

// Dispatch order to Steadfast (Admin only)
router.post('/:id/dispatch', protect, authorize('Admin'), dispatchOrderToSteadfast);

export default router;
import { sheets } from '../utils/googleSheets.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Create a new product.
 * Handles image upload to ImgBB if an image is provided.
 */
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            sales_price,
            production_price,
            discount_price,
            status = 'Active'
        } = req.body;

        let product_image_url = req.body.product_image_url || '';

        if (!name || !sales_price || !production_price) {
            return res.status(400).json({ message: 'Missing required fields: name, sales_price, production_price.' });
        }

        // Handle image upload if a file is present in the request
        if (req.file) {
            try {
                const form = new FormData();
                form.append('image', req.file.buffer, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });

                const response = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, form, {
                    headers: form.getHeaders()
                });

                if (response.data.success) {
                    product_image_url = response.data.data.url;
                } else {
                    throw new Error(response.data.error.message || 'ImgBB upload failed');
                }
            } catch (uploadError) {
                console.error('ImgBB Upload Error:', uploadError);
                return res.status(500).json({ message: 'Failed to upload image to ImgBB.', error: uploadError.message });
            }
        }

        const sheet = sheets.products;
        const newProduct = {
            id: uuidv4(),
            name,
            sales_price,
            production_price,
            discount_price: discount_price || 0,
            product_image_url,
            status
        };

        await sheet.addRow(newProduct);
        res.status(201).json({ message: 'Product created successfully', product: newProduct });

    } catch (error) {
        console.error('Create Product Error:', error);
        res.status(500).json({ message: 'Server error while creating product.' });
    }
};

/**
 * Get all products.
 */
export const getAllProducts = async (req, res) => {
    try {
        const sheet = sheets.products;
        const rows = await sheet.getRows();
        const products = rows.map(row => row.toObject());
        res.status(200).json(products);
    } catch (error) {
        console.error('Get All Products Error:', error);
        res.status(500).json({ message: 'Server error while fetching products.' });
    }
};

/**
 * Get a single product by its ID.
 */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.products;
        const rows = await sheet.getRows();
        const product = rows.find(row => row.get('id') === id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json(product.toObject());
    } catch (error) {
        console.error('Get Product By ID Error:', error);
        res.status(500).json({ message: 'Server error while fetching product.' });
    }
};

/**
 * Update a product.
 */
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.products;
        const rows = await sheet.getRows();
        const productRow = rows.find(row => row.get('id') === id);

        if (!productRow) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Update fields provided in the request body
        const fieldsToUpdate = ['name', 'sales_price', 'production_price', 'discount_price', 'product_image_url', 'status'];
        let updated = false;
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                productRow.set(field, req.body[field]);
                updated = true;
            }
        });

        if (updated) {
            await productRow.save();
        }

        res.status(200).json({ message: 'Product updated successfully', product: productRow.toObject() });
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ message: 'Server error while updating product.' });
    }
};

/**
 * Delete a product.
 */
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.products;
        const rows = await sheet.getRows();
        const productRow = rows.find(row => row.get('id') === id);

        if (!productRow) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        await productRow.delete();
        res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ message: 'Server error while deleting product.' });
    }
};

import { Router } from 'express';
import multer from 'multer';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from './products.controller.js';
import { protect, authorize } from '../authentication/auth.middleware.js';

const router = Router();

// Configure multer for memory storage to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Product Routes ---

// Get all products (Accessible by Admin and Moderator)
router.route('/')
    .get(protect, authorize('Admin', 'Moderator'), getAllProducts)
    // Create a new product (Admin only), handles image upload
    .post(protect, authorize('Admin'), upload.single('product_image'), createProduct);

// Routes for a single product by ID
router.route('/:id')
    // Get a single product (Accessible by Admin and Moderator)
    .get(protect, authorize('Admin', 'Moderator'), getProductById)
    // Update a product (Admin only)
    .put(protect, authorize('Admin'), updateProduct)
    // Delete a product (Admin only)
    .delete(protect, authorize('Admin'), deleteProduct);

export default router;
import { sheets } from '../utils/googleSheets.js';
import { createSingleOrder } from '../utils/steadfast.js';

/**
 * @description Create a Steadfast order/consignment from an existing order in the system.
 * @route POST /api/steadfast
 * @access Private (Admin, Moderator)
 */
export const createSteadfastOrder = async (req, res) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ message: 'Order ID is required.' });
        }

        const ordersSheet = sheets.orders;
        if (!ordersSheet) {
            return res.status(500).json({ message: 'Orders sheet not loaded.' });
        }

        const rows = await ordersSheet.getRows();
        const orderRow = rows.find(row => row.get('order_id') === order_id);

        if (!orderRow) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (orderRow.get('steadfast_tracking_id')) {
            return res.status(400).json({ message: 'Steadfast order already created for this order.' });
        }

        // Fetch product details to calculate COD amount
        const productsSheet = sheets.products;
        const productRows = await productsSheet.getRows();
        const product = productRows.find(p => p.get('id') === orderRow.get('product_id'));

        if (!product) {
            return res.status(404).json({ message: `Product with ID ${orderRow.get('product_id')} not found for this order.` });
        }

        const salesPrice = parseFloat(product.get('sales_price')) || 0;
        const discountPrice = parseFloat(product.get('discount_price')) || 0;
        const deliveryCharge = parseFloat(orderRow.get('delivery_charge')) || 0;

        const codAmount = (salesPrice - discountPrice) + deliveryCharge;

        // Construct payload for Steadfast API
        const steadfastPayload = {
            invoice: orderRow.get('order_id'),
            recipient_name: orderRow.get('customer_name'),
            recipient_phone: orderRow.get('mobile_number'),
            recipient_address: orderRow.get('address'),
            cod_amount: codAmount,
            note: orderRow.get('notes') || '',
        };

        const steadfastResponse = await createSingleOrder(steadfastPayload);

        if (steadfastResponse && steadfastResponse.status === 200 && steadfastResponse.consignment) {
            const { tracking_code } = steadfastResponse.consignment;

            // Update the order in Google Sheet
            orderRow.set('steadfast_tracking_id', tracking_code);
            orderRow.set('status', 'Shipped'); // Update status to reflect it's been sent to courier
            orderRow.set('updated_at', new Date().toISOString());
            await orderRow.save();

            res.status(201).json({
                message: 'Steadfast order created successfully.',
                consignment: steadfastResponse.consignment
            });
        } else {
            return res.status(400).json({ message: 'Failed to create Steadfast order.', error: steadfastResponse.message || 'Unknown error from Steadfast API.' });
        }
    } catch (error) {
        const errorMessage = error.message.includes('{') ? JSON.parse(error.message) : { message: error.message };
        console.error('Create Steadfast Order Error:', errorMessage);
        res.status(500).json({ message: 'Server error while creating Steadfast order.', error: errorMessage });
    }
};import { Router } from 'express';
import { createSteadfastOrder } from './steadfast.controller.js';
import { protect, authorize } from '../authentication/auth.middleware.js';

const router = Router();

// @route   POST api/steadfast
// @desc    Create a Steadfast consignment for an existing order
// @access  Private (Admin, Moderator)
router.post('/', protect, authorize('Admin', 'Moderator'), createSteadfastOrder);

export default router;
import { sheets } from '../utils/googleSheets.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new task.
 */
export const createTask = async (req, res) => {
    try {
        const {
            order_id,
            task_details,
            assigned_to, // User ID to whom the task is assigned
            due_date,
            priority = 'Medium'
        } = req.body;

        if (!order_id || !task_details || !assigned_to) {
            return res.status(400).json({ message: 'Missing required fields: order_id, task_details, assigned_to.' });
        }

        const sheet = sheets.tasks;
        const newTask = {
            task_id: uuidv4(),
            order_id,
            task_details,
            assigned_to,
            status: 'Pending',
            created_at: new Date().toISOString(),
            due_date: due_date || '',
            priority
        };

        await sheet.addRow(newTask);
        res.status(201).json({ message: 'Task created successfully', task: newTask });

    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ message: 'Server error while creating task.' });
    }
};

/**
 * Get all tasks.
 * Admins see all tasks.
 * Moderators see only tasks assigned to them.
 */
export const getAllTasks = async (req, res) => {
    try {
        const sheet = sheets.tasks;
        const rows = await sheet.getRows();
        let tasks = rows.map(row => row.toObject());

        if (req.user.role === 'Moderator') {
            tasks = tasks.filter(task => task.assigned_to === req.user.id);
        }

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Get All Tasks Error:', error);
        res.status(500).json({ message: 'Server error while fetching tasks.' });
    }
};

/**
 * Get a single task by its ID.
 */
export const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.tasks;
        const rows = await sheet.getRows();
        const taskRow = rows.find(row => row.get('task_id') === id);

        if (!taskRow) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        if (req.user.role === 'Moderator' && taskRow.get('assigned_to') !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden. You can only view your own tasks.' });
        }

        res.status(200).json(taskRow.toObject());
    } catch (error) {
        console.error('Get Task By ID Error:', error);
        res.status(500).json({ message: 'Server error while fetching task.' });
    }
};

/**
 * Update a task.
 */
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.tasks;
        const rows = await sheet.getRows();
        const taskRow = rows.find(row => row.get('task_id') === id);

        if (!taskRow) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        if (req.user.role === 'Moderator' && taskRow.get('assigned_to') !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden. You can only update your own tasks.' });
        }

        const fieldsToUpdate = ['task_details', 'assigned_to', 'status', 'due_date', 'priority'];
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                taskRow.set(field, req.body[field]);
            }
        });

        await taskRow.save();
        res.status(200).json({ message: 'Task updated successfully', task: taskRow.toObject() });

    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ message: 'Server error while updating task.' });
    }
};

/**
 * Delete a task (Admin only).
 */
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = sheets.tasks;
        const rows = await sheet.getRows();
        const taskRow = rows.find(row => row.get('task_id') === id);

        if (!taskRow) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        await taskRow.delete();
        res.status(200).json({ message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({ message: 'Server error while deleting task.' });
    }
};

import { Router } from 'express';
import {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
} from './tasks.controller.js';
import { protect, authorize } from '../authentication/auth.middleware.js';

const router = Router();

// --- Task Routes ---

router.route('/')
    .get(protect, authorize('Admin', 'Moderator'), getAllTasks)
    .post(protect, authorize('Admin', 'Moderator'), createTask);

router.route('/:id')
    .get(protect, authorize('Admin', 'Moderator'), getTaskById)
    .put(protect, authorize('Admin', 'Moderator'), updateTask)
    .delete(protect, authorize('Admin'), deleteTask); // Only Admins can delete tasks

export default router;

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

// This object will hold all the initialized sheets.
export const sheets = {
    users: null,
    products: null,
    orders: null,
    followUps: null,
    tasks: null,
};

/**
 * Initializes the Google Spreadsheet document and all the required sheets by their titles.
 */
export const initDoc = async () => {
    await doc.loadInfo();
    console.log(`✅ Google Spreadsheet '${doc.title}' initialized`);

    sheets.users = doc.sheetsByTitle['Users'];
    sheets.products = doc.sheetsByTitle['Products'];
    sheets.orders = doc.sheetsByTitle['Orders'];
    sheets.followUps = doc.sheetsByTitle['Followups'];
    sheets.tasks = doc.sheetsByTitle['Tasks'];

    // Check if all sheets were loaded successfully
    for (const [sheetName, sheet] of Object.entries(sheets)) {
        if (!sheet) {
            console.error(`❌ Sheet '${sheetName}' not found. Make sure a sheet with this exact title exists.`);
            // throw new Error(`Sheet '${sheetName}' not found.`);
        } else {
            console.log(`✅ Sheet '${sheet.title}' loaded successfully.`);
        }
    }
};

import axios from 'axios';

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

const getSteadfastHeaders = () => ({
    'Api-Key': process.env.STEADFAST_API_KEY,
    'Secret-Key': process.env.STEADFAST_SECRET_KEY,
    'Content-Type': 'application/json'
});

/**
 * Creates a single order with Steadfast Courier.
 * @param {object} orderData - The order details for Steadfast.
 * @returns {Promise<object>} The response from Steadfast API.
 */
export const createSingleOrder = async (orderData) => {
    try {
        const response = await axios.post(`${STEADFAST_BASE_URL}/create_order`, orderData, {
            headers: getSteadfastHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Steadfast Single Order Creation Error:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
};

/**
 * Creates multiple orders with Steadfast Courier in bulk.
 * @param {Array<object>} ordersData - An array of order details for Steadfast.
 * @returns {Promise<object>} The response from Steadfast API.
 */
export const createBulkOrders = async (ordersData) => {
    try {
        const response = await axios.post(`${STEADFAST_BASE_URL}/create_order/bulk-order`, { data: ordersData }, {
            headers: getSteadfastHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Steadfast Bulk Order Creation Error:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
};

/**
 * Checks the delivery status of an order by tracking code.
 * @param {string} trackingCode - The tracking code from Steadfast.
 * @returns {Promise<object>} The response from Steadfast API.
 */
export const checkDeliveryStatusByTrackingCode = async (trackingCode) => {
    try {
        const response = await axios.get(`${STEADFAST_BASE_URL}/status_by_trackingcode/${trackingCode}`, {
            headers: getSteadfastHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Steadfast Check Status Error:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
};

/**
 * Checks the current balance with Steadfast.
 * @returns {Promise<object>} The response from Steadfast API.
 */
export const checkBalance = async () => {
    try {
        const response = await axios.get(`${STEADFAST_BASE_URL}/get_balance`, {
            headers: getSteadfastHeaders()
        });
        return response.data;
    } catch (error) {
        console.error('Steadfast Check Balance Error:', error.response ? error.response.data : error.message);
        throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
};
