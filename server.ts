import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import Paystack from 'paystack';
import crypto from 'node:crypto';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY!);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Webhook needs raw body, register it BEFORE express.json()
  app.post("/api/paystack-webhook", express.raw({type: 'application/json'}), async (req, res) => {
    // Webhook verification logic
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(req.body).digest('hex');
    
    if (hash === req.headers['x-paystack-signature']) {
        const event = JSON.parse(req.body.toString());
        if (event.event === 'charge.success') {
            const { bookingId } = event.data.metadata;
            const { reference, amount } = event.data;
            
            // Update booking status
            await supabase.from('bookings').update({ status: 'paid', payment_status: 'paid', payment_reference: reference, amount_paid: amount / 100 }).eq('id', bookingId);
            // Update payment status
            await supabase.from('payments').update({ status: 'success' }).eq('reference', reference);
        }
    }
    res.sendStatus(200);
  });

  // Apply JSON body parser for other routes
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-payment", async (req, res) => {
    const { bookingId, amount, email } = req.body;
    
    // Paystack initiation
    try {
        const transaction = await paystack.transaction.initialize({
            amount: amount * 100, // Paystack uses kobo
            email,
            metadata: { bookingId }
        });
        
        // Save payment record to DB
        await supabase.from('payments').insert({
            booking_id: bookingId,
            reference: transaction.data.reference,
            amount: amount,
            status: 'pending'
        });
        
        res.json({ authorization_url: transaction.data.authorization_url });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
