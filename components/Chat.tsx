"use client"
import React from 'react'
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2Icon } from "lucide-react";
// import ChatMessage from "./ChatMessage";
import { useCollection } from "react-firebase-hooks/firestore";
import { useUser } from "@clerk/nextjs";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import askQuestion from '@/actions/askQuestion';
import ChatMessage from './ChatMessage';
import { useToast } from '@/hooks/use-toast';

export type Message = {
    id?: string;
    role: "human" | "ai" | "placeholder";
    message: string;
    createdAt: Date;
};

const Chat = ({id} : {id: string}) => {

    const {user} = useUser() // get the current loggin user and all the data related to this user
    const {toast} = useToast();

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isPending, startTransition] = useTransition();
    const bottomOfChatRef = useRef<HTMLDivElement>(null);

    // connection react-fire base-hook. snap shot give the real time listner of chat doc
    const [snapshot, loading] = useCollection(
        user && query(
            collection(db, "users", user?.id, "files", id, "chat"),
            orderBy('createdAt', "asc")
        )
    )

    // auto scroll when messages changes.
    useEffect(() => {
        bottomOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages]);
    
      useEffect(() => {
        if (!snapshot) return;
      
        console.log("Updated snapshot", snapshot.docs);
      
        // Naya messages array banao from snapshot
        const newMessages = snapshot.docs.map((doc) => {
          const { role, message, createdAt } = doc.data();
          return {
            id: doc.id,
            role,
            message,
            createdAt: createdAt.toDate(),
          };
        });
      
        // Agar current state ke last message mein "Thinking..." hai,
        // to sirf tab update karo jab newMessages ka last message "Thinking..." se alag ho.
        const lastCurrentMessage = messages[messages.length - 1];
        const lastNewMessage = newMessages[newMessages.length - 1];
      
        if (lastCurrentMessage?.role === "ai" && lastCurrentMessage.message === "Thinking...") {
          if (lastNewMessage && lastNewMessage.message !== "Thinking...") {
            setMessages(newMessages);
          }
        } else {
          setMessages(newMessages);
        }
      }, [snapshot]);
      

    const handleSubmit = async (e: FormEvent)=>{
        e.preventDefault()

        const q = input;

        setInput('')

        // Optimistic UI update
        setMessages((prev) => [
            ...prev,
            {
            role: "human",
            message: q,
            createdAt: new Date(),
            },
            {
            role: "ai",
            message: "Thinking...",
            createdAt: new Date(),
            },
        ]);

        startTransition(async ()=>{
            const {success, message} = await askQuestion(id, q);
    
            if(!success){
              // Toast notification.
              toast({
                variant: "destructive",
                title: "Error",
                description: message,
              });

              setMessages((prev) =>
              prev.slice(0, prev.length - 1).concat([
                  {
                      role:"ai",
                      message:   `Whoops... ${message}`,
                      createdAt: new Date()
                  },
              ])
            )
            }
        })
    
    };

   
  return (
    <div className='flex flex-col h-full overflow-scroll'>
        {/* chat content */}
        <div className='flex-1 w-full'>
            {/* chat message... */}
            {loading ? (
          <div className="flex items-center justify-center">
            <Loader2Icon className="animate-spin h-20 w-20 text-indigo-600 mt-20" />
          </div>
        ) : (
          <div className="p-5">
            {messages.length === 0 && (
              <ChatMessage
                key={"placeholder"}
                message={{
                  role: "ai",
                  message: "Ask me anything about the document!",
                  createdAt: new Date(),
                }}
              />
            )}

            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}

                {/* for auto scroll */}
                <div ref={bottomOfChatRef}/>
            </div>
            )}
            
        </div>

        {/* form */}
        <form onSubmit={handleSubmit}
            className='flex sticky bottom-0 space-x-2 p-5 bg-indigo-600/75'
        >
            <Input 
                placeholder="Ask a Question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />

            <Button type='submit' disabled={!input || isPending}>
                {isPending ? (
                    <Loader2Icon className='animate-spin text-indigo-600'/>
                ) : ("Ask")}
            </Button>
        </form>
    </div>
  )
}

export default Chat