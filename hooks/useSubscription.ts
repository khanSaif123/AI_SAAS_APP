    "use client"
    import { db } from '@/firebase';
    import { useUser } from '@clerk/nextjs';
    import { collection, doc } from 'firebase/firestore';
    import  { useEffect, useState } from 'react'
    import { useCollection, useDocument } from "react-firebase-hooks/firestore";

    // going to define pro limit and base limit.
    const PRO_LIMIT = 20;
    const FREE_LIMIT = 2
    const useSubscription = () => {
        const [hasActiveMembership, setHasActiveMembership] = useState(null);
        const [isOverFileLimit, setIsOverFileLimit] = useState(false);
        const {user} = useUser()

        //   Listen to the User document
        const [snapshot, loading, error] = useDocument(
            user && doc(db, "users", user.id),
            {
            snapshotListenOptions: { includeMetadataChanges: true }, // if any changes like document property
                                                                    // it will go and update oue snapshot
            }
        );

        //   Listen to the users files collection
        const [filesSnapshot, filesLoading] = useCollection(
            user && collection(db, "users", user?.id, "files")
        );

        useEffect(() => {
            if (!snapshot?.exists()) return; // Check if document exists
            
            const data = snapshot.data();
            setHasActiveMembership(data.hasActiveMembership || false); // Default to false
        }, [snapshot]);

        useEffect(() => {
            if (!filesSnapshot || hasActiveMembership === null) return;

            const files = filesSnapshot.docs;
            const usersLimit = hasActiveMembership ? PRO_LIMIT : FREE_LIMIT;
            setIsOverFileLimit(files.length >= usersLimit); // Update file limit status
            
        }, [filesSnapshot, hasActiveMembership]);

        return { 
            hasActiveMembership: hasActiveMembership || false, // Ensure boolean return
            loading: loading || filesLoading,
            error,
            isOverFileLimit 
        };
    }

    export default useSubscription