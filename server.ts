import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import Paystack from "paystack";

let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase URL and Anon Key are required for server operations.");
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ── Webhook MUST come before express.json() ──────────────────────────────
  app.post(
    "/api/paystack-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        res.sendStatus(500);
        return;
      }

      const hash = crypto
        .createHmac("sha512", secret)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        res.sendStatus(401);
        return;
      }

      try {
        const event = JSON.parse(req.body.toString());

        if (event.event === "charge.success") {
          const { bookingId } = event.data.metadata;
          const { reference, amount } = event.data;

          await getSupabase()
            .from("bookings")
            .update({
              payment_status: "paid",
              payment_reference: reference,
              amount_paid: amount / 100,
            })
            .eq("id", bookingId);

          await getSupabase()
            .from("payments")
            .update({ status: "success" })
            .eq("reference", reference);
        }
      } catch (e) {
        console.error("Webhook processing error:", e);
      }

      res.sendStatus(200);
    }
  );

  // ── JSON body parser for all other routes ────────────────────────────────
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-payment", async (req, res) => {
    const { bookingId, amount, email } = req.body;

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      res.status(500).json({ error: "Paystack secret key not configured" });
      return;
    }

    const paystack = Paystack(secret);

    try {
      const transaction = await paystack.transaction.initialize({
        amount: amount * 100, // kobo
        email,
        metadata: { bookingId },
      });

      await getSupabase().from("payments").insert({
        booking_id: bookingId,
        reference: transaction.data.reference,
        amount,
        status: "pending",
      });

      res.json({ authorization_url: transaction.data.authorization_url });
    } catch (e: any) {
      console.error("Payment init error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Vite / static ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
