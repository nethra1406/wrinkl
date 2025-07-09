const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_API_URL = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_ANON_KEY");

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const order = payload.record;

    // 🔍 Fetch customer info using customer_id from orders table
    const customerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/customers?id=eq.${order.customer_id}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
        },
      }
    );

    const customerData = await customerRes.json();
    const customer = customerData[0];

    if (!customer) throw new Error("Customer not found!");

    // 🟢 WhatsApp Message Body
    const message = {
      messaging_product: "whatsapp",
      to: customer.phone,
      type: "template",
      template: {
        name: "order_confirmation",
        language: {
          code: "en_US",
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customer.name },
              { type: "text", text: order.id },
              { type: "text", text: order.items || "Laundry Package" },
              { type: "text", text: order.delivery_date || "Tomorrow" },
              { type: "text", text: "+91 90433 31484" },
            ],
          },
        ],
      },
    };

    const response = await fetch(WHATSAPP_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("WhatsApp Error:", error);
      throw new Error(`WhatsApp API Error: ${error.error.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
