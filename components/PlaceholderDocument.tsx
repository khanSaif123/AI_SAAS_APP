"use client"
import React from 'react'
import { Button } from './ui/button'
import { Frown, FrownIcon, PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import useSubscription from '@/hooks/useSubscription'

const PlaceholderDocument = () => {
  const {isOverFileLimit} = useSubscription()

    // this router allow me to send the user to different location.
    const router = useRouter()

    const handleClick = ()=>{
        // check if the user is FREE tier and if they over the file limit, push to the upgrade page.
        if(isOverFileLimit){
          router.push("/dashboard/upgrade")
        }else{
          router.push('/dashboard/upload')
        }
        
    }

  return (
   <Button className='flex flex-col items-center justify-center w-64 h-80 rounded-xl 
    bg-gray-200 drop-shadow-md text-gray-400'
    onClick={handleClick}
    >
        {isOverFileLimit ? (
          <FrownIcon style={{ width: "64px", height: "64px" }}/>
        ) 
        : (
          <PlusCircle style={{ width: "64px", height: "64px" }}/>
        ) }
        <p>Add a document</p>
   </Button>
  )
}

export default PlaceholderDocument