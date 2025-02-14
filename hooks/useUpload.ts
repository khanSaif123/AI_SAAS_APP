"use client"
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
// import { useRouter } from "next/router";
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid';

export enum StatusText {
    UPLOADING = "Uploading file....",
    UPLOADED = "File uploaded successfully",
    SAVING = "Saving file to database...",
    GENERATING = "Generating AI Embedding, This will only take a few seconds..."
}

export type Status = StatusText[keyof StatusText]

function useUpload(){
    const [progress, setProgress] = useState<number | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [status, setStatus] = useState<Status | null>(null);

    // hook clerk provide this
    const {user} = useUser() // this give the current logged in user.
    // const router = useRouter()

    const handleUpload = async (file: File) =>{
        if(!file || !user){
            return
        }
        //Free or pro limitation... TODO:
    
        const fileIdToUpload = uuidv4()

        const storageRef = ref(storage,`users/${user.id}/files/${fileIdToUpload}`)

        const uploadTask = uploadBytesResumable(storageRef, file)

        uploadTask.on('state_changed', async (snapshot)=>{
            // calculate the % of upload.
            const percent = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            )
            setStatus(StatusText.UPLOADING) // uploading
            setProgress(percent)
        }, (err)=>{
            console.log(err)
        },
       async ()=>{
            // here the file is in the fire base storage. now i am going to create a download URL
            setStatus(StatusText.UPLOADED) // successfully uploaded

            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)

            setStatus(StatusText.SAVING)

            await setDoc(doc(db, "users", user.id, "files", fileIdToUpload), {
                name: file.name,
                size: file.size,
                type: file.type,
                downloadUrl : downloadUrl,
                ref : uploadTask.snapshot.ref.fullPath,
                createdAt: Date.now()
            })

            setStatus(StatusText.GENERATING)
            // GENERATE AI EMBADING....

            setFileId(fileIdToUpload)
        } // when upload complete
    );

    };

    return {progress, fileId, status, handleUpload}
}

export default useUpload