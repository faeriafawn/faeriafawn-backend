window.addEventListener('DOMContentLoaded', () => {
  const music = document.getElementById('bg-music');
  const toggle = document.getElementById('music-toggle');
  const icon = document.getElementById('music-icon');

  toggle.addEventListener('click', () => {
    music.muted = false;         // unmute on first interaction
    music.volume = 0.2;          // set gentle volume

    if (music.paused) {
      music.play();
      icon.src = 'assets/icons/sound-on.png';
    } else {
      music.pause();
      icon.src = 'assets/icons/sound-off.png';
    }
  });
});

// server.js
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // replace with your real secret key

const app = express();
app.use(cors());
app.use(express.json());

// Example product catalog
const products = {
  "faeriafawn-print": { name: "Faeria Fawn Print", amount: 250 },  
  "dewlight-valley-print": { name: "Dewlight Valley Print", amount: 250 },
  "faeriafawn-stickers": { name: "Faeria Fawn Stickers", amount: 200 },
  "sweet-strawbie-bunnie-stickers": { name: "Sweet Strawbie Bunnie Stickers", amount: 200 },
  "billie-sox-stickers": { name: "Billie Sox Stickers", amount: 200 },
};

app.post("/create-checkout-session", async (req, res) => {
  const { cart } = req.body; 
  // cart should be an array of objects like: [{ productId: "faeriafawn-print", quantity: 2 }, ...]

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Cart is empty or invalid" });
  }

  try {
    const line_items = cart.map(item => {
      const product = products[item.productId];
      if (!product) {
        throw new Error(`Invalid product ID: ${item.productId}`);
      }
      return {
        price_data: {
          currency: "gbp",
          product_data: { name: product.name },
          unit_amount: product.amount,
        },
        quantity: item.quantity || 1, // use quantity from cart, default to 1
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "klarna", "apple pay", "google pay"],
      line_items,
      mode: "payment",
      shipping_address_collection: {
  allowed_countries: ["GB"]
},
shipping_options: [
  { shipping_rate: "shr_1SaKBOBpMZrXSKhBbYuppYRs" },
],
      success_url: "https://faeriafawn.uk/success.html",
      cancel_url: "https://faeriafawn.uk/cancel.html",
    });

   if (session.url) {
  res.json({ url: session.url });
} else {
  res.status(500).json({ error: "Stripe did not return a session URL." });
}
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
