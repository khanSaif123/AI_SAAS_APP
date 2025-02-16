import React from 'react'
import {auth} from '@clerk/nextjs/server';
import { adminDb } from '@/firebaseAdmin';
import PdfView from '@/components/PdfView';
import Chat from '@/components/Chat';

const ChatToFilePage = async (props: {
  params : {
      id: string;
  }
}) => {
  
  auth.protect(); // if user is logged in then only listen to the request.

    // Destructure params after authentication
  const { id } = props.params;
  
  const {userId} = await auth()

  // get the download url or actual pdf.
  const ref = await adminDb
  .collection('users')
  .doc(userId!)
  .collection('files')
  .doc(id)
  .get()

  const url = ref.data()?.downloadUrl;
  return (
    <div className="grid lg:grid-cols-5 h-full overflow-hidden">
      {/* Right */}
      <div className="col-span-5 lg:col-span-2 overflow-y-auto">
        {/* Chat */}
        <Chat id={id}/>
      </div>

      {/* Left */}
      <div className="col-span-5 lg:col-span-3 bg-gray-100 border-r-2 lg:border-indigo-600 lg:-order-1 overflow-auto">
        {/* PDFView */}
        <PdfView url={url} />
      </div>
    </div>
  )
}

export default ChatToFilePage