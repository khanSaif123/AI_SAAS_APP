"use server"

import { adminDb, adminStorage } from "@/firebaseAdmin";
import { indexName } from "@/lib/langchain";
import pineconeClient from "@/lib/pinecone";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function deleteDocument(docId: string) {
    // 1 - delete from fire store 
    // 2 - delete pinecone embedding the namespace. that resemble the pdf document

    auth().protect()

    const {userId} = auth()

    // 1
    await adminDb
    .collection("users")
    .doc(userId!)
    .collection("files")
    .doc(docId)
    .delete()

    // 2
    await adminStorage
    .bucket(process.env.FIREBASE_STORAGE_BUCKET)
    .file(`users/${userId}/files/${docId}`)

    // delete the embading associated with the document.
    const index = await pineconeClient.index(indexName)
        index.namespace(docId).deleteAll(); 

    revalidatePath("/dashboard")
    
}