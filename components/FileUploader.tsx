"use client"
import React, { JSX, useCallback, useEffect } from 'react'
import {useDropzone} from 'react-dropzone'
import {
  CheckCheckIcon,
  CircleArrowDown,
  HammerIcon,
  RocketIcon,
  SaveIcon
} from "lucide-react"
import useUpload, { StatusText } from '@/hooks/useUpload'
import { useRouter } from 'next/navigation'

const FileUploader = () => {

  // custom hook for handle uplade
  const {progress, status, fileId, handleUpload} = useUpload()
  const router = useRouter()

  console.log("file id -> ", fileId)

  useEffect(()=>{

    if(fileId){
      router.push(`/dashboard/files/${fileId}`)
    
    }
  }, [fileId, router])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if(file){
      await handleUpload(file)
      
    }else{
      // toast notification
    }
},[])

const statusIcons: {
  [key in StatusText]: JSX.Element
} = {
  [StatusText.UPLOADING]: (
    <RocketIcon className='h-20 w-20 text-indigo-600'/>
  ),
  [StatusText.UPLOADED]: (
    <CheckCheckIcon className='h-20 w-20 text-indigo-600'/>
  ),
  [StatusText.SAVING]: (
    <HammerIcon className='h-20 w-20 text-indigo-600'/>
  ),
  [StatusText.GENERATING]:(<SaveIcon className='h-20 w-20 text-indigo-600 animate-bounce'/>)
}

const {getRootProps, getInputProps, isDragActive, isFocused, isDragAccept} = useDropzone(
{
onDrop,
maxFiles: 1,
accept : {
  "application/pdf": ["pdf"]
}
})

const uploadInProgress = progress != null && progress >= 0 && progress <= 100

   return (
     <div className='flex flex-col gap-4 items-end max-w-7xl mx-auto'>
 
         {/* loading section */}
         {uploadInProgress && (
          <div className='mt-32 w-full flex flex-col justify-center items-center gap-5'>
            <div
              className={`radial-progress bg-indigo-300 text-white border-indigo-600 border-4 
              ${progress === 100 && "hidden"} `}
                role='progressbar'
                style={{
                  // @ts-ignore
                  "--value": progress,
                  "--size": "12rem",
                  "--thikness": "1.3rem"
                }}
            >{progress}%</div>

            {/* status icone */}
            {statusIcons[status as StatusText]}

            <p className='text-indigo-600 animate-pulse'>{status?.toString()}</p>
          </div>
         )}
 
         <div {...getRootProps()}
         className={`p-10 border-indigo-600 text-indigo-600 border-2 border-dashed mt-10 w-[90%]
         rounded-lg mx-auto text-center h-96 flex items-center justify-center ${isFocused || isDragAccept ? 
             " bg-indigo-300 " : " bg-indigo-100 "
         }
         `} 
         >
         <input {...getInputProps()} />
         <div className='flex flex-col items-center'>
         {
             isDragActive ?
             (
                 <>
                     <RocketIcon className='h-20 w-20 animate-ping'/>
                     <p>Drop the files here ...</p> 
                     
                 </>
             ): (<>
                     <CircleArrowDown className='w-20 h-20 animate-bounce'/>
                     <p>Drag n drop some files here, or click to select files</p>
                 </>)
         }
         </div>
         </div>
     </div>
   )
}

export default FileUploader