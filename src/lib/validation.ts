
import { z } from 'zod';

// Phone number validation for Bangladesh
export const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common validation schemas
export const orderValidationSchema = z.object({
  customer_name: z.string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be less than 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Customer name contains invalid characters'),
  
  mobile_number: z.string()
    .regex(phoneRegex, 'Please enter a valid Bangladesh phone number'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters'),
  
  product_id: z.string()
    .uuid('Please select a valid product'),
  
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity cannot exceed 999'),
  
  delivery_charge: z.number()
    .min(0, 'Delivery charge cannot be negative')
    .max(1000, 'Delivery charge seems too high'),
  
  order_source: z.enum(['Messenger', 'Call', 'WhatsApp', 'Website'], {
    required_error: 'Please select an order source'
  }),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  
  status: z.enum([
    'Pending Moderator',
    'Package to Confirmation',
    'In Review',
    'Pending',
    'Delivered',
    'Cancelled',
    'Office Received'
  ])
});

export const userValidationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters'),
  
  email: z.string()
    .email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  
  mobile_number: z.string()
    .regex(phoneRegex, 'Please enter a valid Bangladesh phone number'),
  
  role: z.enum(['Admin', 'Moderator'])
});

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('88')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  return `+88 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
};

export type OrderFormData = z.infer<typeof orderValidationSchema>;
export type UserFormData = z.infer<typeof userValidationSchema>;
