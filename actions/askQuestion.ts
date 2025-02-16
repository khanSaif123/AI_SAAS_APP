"use server"

import { adminDb } from '@/firebaseAdmin';
import { auth } from '@clerk/nextjs/server'
import { Message } from "@/components/Chat";
import React from 'react'
import { generateLangchainCompletion } from '@/lib/langchain';

const FREE_LIMIT = 3;
const PRO_LIMIT = 100;

const askQuestion = async (id: string, question: string) => {
    auth.protect()
    const {userId} = await auth()
    
    // get the collection where we goona push our chat.
    const chatRef = adminDb
    .collection("users")
    .doc(userId!)
    .collection("files")
    .doc(id)
    .collection("chat")

    // check how many user messages are in the chat
    const chatSnapshot = await chatRef.get();
    const userMessages = chatSnapshot.docs.filter(
        (doc) => doc.data().role === "human"
    );
    
    // limit the pro or free user: TODO

    const userMessage: Message = {
        role: "human",
        message: question,
        createdAt: new Date(),
    };

    // Save in database.
    await chatRef.add(userMessage)

    // generate AI response.
    const reply = await generateLangchainCompletion(id, question);

    const aiMessage: Message = {
        role: "ai",
        message: reply,
        createdAt: new Date(),
    };

    await chatRef.add(aiMessage)

    return {success: true, message: null}
}

export default askQuestion