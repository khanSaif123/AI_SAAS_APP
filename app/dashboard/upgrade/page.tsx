"use client"
import { createRazorpayPortal } from '@/actions/createRazorpayPortal'
import { Button } from '@/components/ui/button'
import useSubscription from '@/hooks/useSubscription'
import { useUser } from '@clerk/nextjs'
import { CheckIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, {useTransition } from 'react'

export type UserDetails = {
    email: string,
    name: string
}

const PricingPage = () => {
    const {user} = useUser()
    const router = useRouter()
    const {hasActiveMembership, loading} = useSubscription()
    const [isPending, startTransition] = useTransition()


    const handleUpgrade = async () => {
        if (!user) return
      
    startTransition(async () => {

        try {

          if(hasActiveMembership){
            // Razorpay Subscription Portal
            const razorpayPortalUrl = await createRazorpayPortal();
            return router.push(razorpayPortalUrl);
          }

          // Step 1: Order create karein
          const response = await fetch('/api/payment', {
            method: 'POST'
          });
          
          const order = await response.json()
      
          // Step 2: Razorpay modal open karein
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            amount: order.amount,
            currency: order.currency,
            name: 'PDF Companion Pro',
            description: 'Monthly Subscription',
            order_id: order.id,
            handler: async function(response: any) {
              // Payment success logic
              await fetch('/api/payment/success', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  userId: user.id
                })
              })
              
              router.refresh()
              setTimeout(() => router.refresh(), 2000);
            },
            prefill: {
              name: user.fullName || '',
              email: user.primaryEmailAddress?.toString() || ''
            }
          }
      
          const rzp = new (window as any).Razorpay(options)
          console.log("rayzer pay ---> ", rzp)
          rzp.open()
          
        } catch (error) {
          console.error('Payment Error:', error)
        }
        
      });
    };

  return (
    <div>
        <div className='py-24 sm:py-32'>
            <div className='max-w-4xl mx-auto text-center'>
                <h2  className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
                <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Supercharge your Document Companion</p>
            </div>

            <p className="mx-auto mt-6 max-w-2xl px-10 text-center text-lg leading-8 text-gray-600">
                Choose an affordable plan thats packed with the best features for
                interacting with your PDFs, enhancing productivity, and streamlining
                your workflow.
            </p>

            {/* pricing boxes */}
            <div className='max-w-md mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 md:max-w-2xl
                gap-8 lg:max-w-4xl
            '>
                {/* free */}
                <div className='ring-1 ring-gray-200 p-8 pb-12 rounded-3xl'>
                    <h3 className="text-lg font-semibold leading-8 text-gray-900">
                        Starter Plan
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                        Explore Core Features at No Cost
                    </p>

                    <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-gray-900">
                            Free
                        </span>
                    </p>

                    <ul
                        role="list"
                        className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
                    >
                        <li className="flex gap-x-3">
                            <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />2
                            Documents
                        </li>
                        <li className="flex gap-x-3">
                            <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                            Up to 3 messages per document
                        </li>
                        <li className="flex gap-x-3">
                            <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                            Try out the AI Chat Functionality
                        </li>
                    </ul>
                </div>

                {/* pro */}
                <div className='ring-2 ring-indigo-600 rounded-3xl p-8'>
                    
                    <h3 className="text-lg font-semibold leading-8 text-indigo-600">
                        Pro Plan
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                        Maximize Productivity with PRO Features
                    </p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-gray-900">
                            ₹199
                        </span>
                        <span className="text-sm font-semibold leading-6 text-gray-600">
                            / month
                        </span>
                    </p>

                    <Button
                        className="bg-indigo-600 w-full text-white shadow-sm hover:bg-indigo-500 mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        disabled={loading || isPending}
                        onClick={handleUpgrade}
                    >
                        {loading ? "Checking Subscription..." : 
                        isPending ? "Processing..." : 
                        hasActiveMembership ? "Manage Plan" : "Upgrade to Pro"}
                    </Button>

                    <ul
              role="list"
              className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
            >
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                Store upto 20 Documents
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                Ability to Delete Documents
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                Up to 100 messages per document
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                Full Power AI Chat Functionality with Memory Recall
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                Advanced analytics
              </li>
              <li className="flex gap-x-3">
                <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                24-hour support response time
              </li>
            </ul>
                      
                </div>
            </div>
        </div>   
    </div>
  )
}

export default PricingPage