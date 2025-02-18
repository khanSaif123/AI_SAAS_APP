"use server";

import { adminDb } from "@/firebaseAdmin";
// import getBaseUrl from "@/lib/getBaseUrl";
import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";

export async function createRazorpayPortal() {
  auth().protect();

  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // Get customer ID from Firebase
  const user = await adminDb.collection("users").doc(userId).get();
  const razorpayCustomerId = user.data()?.paymentId;

  console.log("yahan hai user ", user)
  console.log("ye hai id ", razorpayCustomerId)

  if (!razorpayCustomerId) {
    throw new Error("Razorpay customer not found");
  }

    // Initialize Razorpay
    const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        key_secret: process.env.NEXT_PUBLIC_RAZORPAY_SECRET!,
    });

  // Redirect User to Razorpay Subscription Dashboard
  const subscriptionPortalUrl = `https://dashboard.razorpay.com/app/subscriptions/${razorpayCustomerId}`;
  
  return subscriptionPortalUrl;
}
