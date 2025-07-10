import React from 'react';
import { formatCurrency, formatPhoneNumber } from '@/lib/validation';

interface Order {
    order_id: string;
    total_amount: number | string;
    delivery_charge: number | string;
    customer_name: string;
    mobile_number: string;
    email?: string;
    address: string;
    created_at: string;
    order_source: string;
    status: string;
    quantity?: number;
    notes?: string;
}

interface Product {
    name?: string;
    discount_price?: number;
    sales_price?: number;
}

interface InvoiceTemplateProps {
    order: Order;
    product: Product;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ order, product }) => {
    const totalAmount = Number(order.total_amount) || 0;
    const deliveryCharge = Number(order.delivery_charge) || 0;
    const grandTotal = totalAmount + deliveryCharge;

    return (
        <div className="p-8 max-w-4xl mx-auto font-sans text-gray-800 bg-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Invoice</h1>
                    <p className="text-sm text-gray-600">Order ID: {order.order_id}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-semibold">Your Company Name</h2>
                    <p className="text-sm text-gray-600">Your Company Address</p>
                    <p className="text-sm text-gray-600">Phone: +8801234567890</p>
                    <p className="text-sm text-gray-600">Email: support@yourcompany.com</p>
                </div>
            </div>

            <div className="border-t border-b py-4 mb-6">
                <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                <p className="text-sm"><strong>Name:</strong> {order.customer_name}</p>
                <p className="text-sm"><strong>Phone:</strong> {formatPhoneNumber(order.mobile_number)}</p>
                {order.email && <p className="text-sm"><strong>Email:</strong> {order.email}</p>}
                <p className="text-sm"><strong>Address:</strong> {order.address}</p>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                <p className="text-sm"><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString('en-GB')}</p>
                <p className="text-sm"><strong>Order Source:</strong> {order.order_source}</p>
                <p className="text-sm"><strong>Status:</strong> {order.status}</p>
            </div>

            <table className="w-full border-collapse mb-6">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Product</th>
                        <th className="border p-2 text-right">Quantity</th>
                        <th className="border p-2 text-right">Unit Price</th>
                        <th className="border p-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border p-2">{product?.name || 'N/A'}</td>
                        <td className="border p-2 text-right">{order.quantity || 1}</td>
                        <td className="border p-2 text-right">
                            {formatCurrency(product?.discount_price || product?.sales_price || 0)}
                        </td>
                        <td className="border p-2 text-right">{formatCurrency(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-end mb-6">
                <div className="w-64">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Delivery Charge:</span>
                        <span>{formatCurrency(deliveryCharge)}</span>

                        <div className="flex justify-between font-semibold text-base border-t pt-2">
                            <span>Grand Total:</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {order.notes && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Notes</h3>
                        <p className="text-sm">{order.notes}</p>
                    </div>
                )}

                <div className="text-center text-sm text-gray-600 mt-8">
                    <p>Thank you for your business!</p>
                    <p>Contact us at support@yourcompany.com for any inquiries.</p>
                </div>
            </div>
        </div>
    );
};
