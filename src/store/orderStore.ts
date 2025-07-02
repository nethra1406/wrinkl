import { create } from 'zustand';
import { Order, OrderFormData } from '../types';
import { useServiceStore } from './serviceStore';
import { supabase } from '../lib/supabase';

interface OrderState {
  cart: {
    [key: number]: number;
  };
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  addToCart: (serviceId: number, quantity: number) => void;
  removeFromCart: (serviceId: number) => void;
  clearCart: () => void;
  submitOrder: (data: OrderFormData) => Promise<Order>;
  fetchOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  cart: {},
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  
  addToCart: (serviceId: number, quantity: number) => {
    set(state => {
      const cart = { ...state.cart };
      
      if (quantity <= 0) {
        delete cart[serviceId];
      } else {
        cart[serviceId] = quantity;
      }
      
      return { cart };
    });
  },
  
  removeFromCart: (serviceId: number) => {
    set(state => {
      const cart = { ...state.cart };
      delete cart[serviceId];
      return { cart };
    });
  },
  
  clearCart: () => {
    set({ cart: {} });
  },
  
  submitOrder: async (data: OrderFormData) => {
    set({ loading: true, error: null });
    
    try {
      console.log('Starting order submission...', data);
      
      const services = useServiceStore.getState().services;
      
      const orderItems = Object.entries(data.items).map(([serviceId, quantity]) => {
        const service = services.find(s => s.id === parseInt(serviceId));
        if (!service) throw new Error(`Service not found: ${serviceId}`);
        
        return {
          serviceId: parseInt(serviceId),
          quantity,
          price: service.price,
          name: service.name,
        };
      });
      
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      console.log('Order items calculated:', orderItems, 'Total:', totalAmount);
      
      // Insert customer first
      console.log('Inserting customer...');
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          phone: data.phone,
          address: data.address,
        })
        .select()
        .single();
      
      if (customerError) {
        console.error('Customer insertion error:', customerError);
        throw customerError;
      }
      
      console.log('Customer created:', customer);
      
      const orderId = `ORD-${Date.now()}`;
      
      // Insert order
      console.log('Inserting order...');
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customer_id: customer.id,
          items: orderItems,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Order insertion error:', orderError);
        throw orderError;
      }
      
      console.log('Order created:', orderData);
      
      const order: Order = {
        id: orderId,
        items: orderItems,
        customer: {
          name: data.name,
          phone: data.phone,
          address: data.address,
        },
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Send WhatsApp notification (optional - don't fail if this fails)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ order }),
        });
        console.log('WhatsApp notification sent');
      } catch (whatsappError) {
        console.warn('WhatsApp notification failed:', whatsappError);
        // Don't fail the order if WhatsApp fails
      }
      
      set(state => ({
        orders: [...state.orders, order],
        currentOrder: order,
        loading: false,
        error: null,
      }));
      
      console.log('Order submission completed successfully');
      return order;
    } catch (error) {
      console.error('Order submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit order';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchOrders: async () => {
    set({ loading: true, error: null });
    
    try {
      console.log('Fetching orders...');
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name,
            phone,
            address
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      
      console.log('Raw orders data:', ordersData);
      
      const orders: Order[] = ordersData.map(orderData => ({
        id: orderData.id,
        items: orderData.items,
        customer: {
          name: orderData.customers.name,
          phone: orderData.customers.phone,
          address: orderData.customers.address,
        },
        totalAmount: orderData.total_amount,
        status: orderData.status,
        createdAt: orderData.created_at,
      }));
      
      console.log('Processed orders:', orders);
      
      set({ orders, loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      set({ 
        error: errorMessage, 
        loading: false 
      });
    }
  },
}));