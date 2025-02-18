import { db } from "@/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const { userId, paymentId } = await req.json();
        
        if (!userId || !paymentId) {
            return new Response(JSON.stringify({ message: "Missing userId or paymentId" }), { status: 400 });
        }

        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            // Agar user nahi hai, to create karo
            await setDoc(userRef, { 
                hasActiveMembership: true, 
                paymentId 
            }, { merge: true });
        } else {
            // Agar user hai, to update karo
            await updateDoc(userRef, { 
                hasActiveMembership: true, 
                paymentId 
            });
        }

        return new Response(JSON.stringify({ message: "Membership updated successfully!" }), { status: 200 });

    } catch (error) {
        console.error("Membership Update Error:", error);
        return new Response(JSON.stringify({ message: "Internal Server Error", error }), { status: 500 });
    }
}
