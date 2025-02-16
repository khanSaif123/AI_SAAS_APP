"use client"
import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation';
import byteSize from "byte-size";
import Link from 'next/link'; // Add this import

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
        </div>
    )
}

export default Document