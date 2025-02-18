// app/api/payment/route.ts
import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.NEXT_PUBLIC_RAZORPAY_SECRET!, // Ensure you use a server-only env variable for secret
});

export async function POST(request: Request) {
  try {
    // Agar aap client se koi data bhejna chahte hain, to use parse kar sakte hain
    // const { amount } = await request.json(); // agar dynamic amount chahiye
    const options = {
      amount: 19900, // 199 rupees = 59900 paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Razorpay Error:', error);
    return NextResponse.json({ error: 'Payment Failed' }, { status: 500 });
  }
}
