"use server"

import { adminDb } from '@/firebaseAdmin';
import { auth } from '@clerk/nextjs/server'
import { Message } from "@/components/Chat";
import { generateLangchainCompletion } from '@/lib/langchain';

const PRO_LIMIT = 20;
const FREE_LIMIT = 2

const askQuestion = async (id: string, question: string) => {
    auth().protect()
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
    const userRef = await adminDb.collection("users").doc(userId!).get()

    // check if user is on FREE plan and has asked more than the FREE number of questions
    
    if(!userRef.data()?.hasActiveMembership){
        if(userMessages.length >= FREE_LIMIT){
            return {
                succes: false,
                message: `You'll need to upgrade to PRO to ask more than ${FREE_LIMIT} questions! 😥`
            }
        }
    }

    // check if user is on PRO plan and has asked more than 100 questions
    if (userRef.data()?.hasActiveMembership) {
        console.log("Debug 4", userMessages.length, PRO_LIMIT);
        if (userMessages.length >= PRO_LIMIT) {
        return {
            success: false,
            message: `You've reached the PRO limit of ${PRO_LIMIT} questions per document! 😢`,
        };
        }
    }
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