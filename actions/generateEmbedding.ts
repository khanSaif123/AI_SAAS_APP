"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

// make sure only authenticated user access this func
export async function generateEmbeddings(docId: string){
    auth.protect() // if u are not authenticated this will thorough u on the login page.

    // turn pdf into embadding
    await generateEmbeddingsPineconeVectorStore(docId);

    revalidatePath('/dashboard')

    return {complete: true}
}