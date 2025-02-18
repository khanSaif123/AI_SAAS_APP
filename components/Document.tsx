"use client"
import  { useTransition } from 'react'
import { useRouter } from 'next/navigation';
import byteSize from "byte-size";
import Link from 'next/link'; // Add this import
import useSubscription from '@/hooks/useSubscription';
import { DownloadCloud, Trash2Icon } from "lucide-react";
import { Button } from './ui/button';
import { deleteDocument } from '@/actions/deleteDocument';

const Document = ({
    id, name, size, downloadUrl
}: {
    id: string;
    name: string;
    size: number;
    downloadUrl: string;
}) => {
    const router = useRouter();
    const [isDeleting, startTransaction] = useTransition();
    const {hasActiveMembership} = useSubscription()

    // Wrap the clickable area with Link instead of using onClick
    return (
        <div className='flex flex-col w-64 h-80 rounded-xl bg-white drop-shadow-md justify-between p-4 transition-all transform hover:scale-105 hover:bg-indigo-600 hover:text-white cursor-pointer group'>
            <Link href={`/dashboard/files/${id}`} className='h-full w-full'>
                <div className='h-full w-full'>
                    <p className="font-semibold line-clamp-2">{name}</p>
                    <p className="text-sm text-gray-500 group-hover:text-indigo-100">
                        {byteSize(size).value} {byteSize(size).unit}
                    </p>
                </div>
            </Link>

            {/* Actions */}
            <div className='flex space-x-2 justify-end'>

            <Button
                variant="outline"
                disabled={isDeleting || !hasActiveMembership}
                onClick={() => {
                    const prompt = window.confirm(
                    "Are you sure you want to delete this document?"
                    );

                    if (prompt) {
                    // delete document
                    startTransaction(async () => {
                        await deleteDocument(id);
                    });
                    }
                }}
                >
                <Trash2Icon className="h-6 w-6 text-red-500" />
                {!hasActiveMembership && (
                    <span className="text-red-500 ml-2">PRO Feature</span>
                )}
                </Button>

                <Button variant="outline" asChild>
                    <a target='_blank' href={downloadUrl}>
                        <DownloadCloud className='h-6 w-6 text-indigo-600'/>
                    </a>
                </Button>

            </div>
        </div>
    )
}

export default Document