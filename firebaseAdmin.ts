import {initializeApp, getApp, getApps, App, cert} from "firebase-admin/app"
import {getFirestore} from "firebase-admin/firestore"
import {getStorage} from "firebase-admin/storage"

// const serviceKey = require('@/service_key.json')

let app: App;

if(getApps().length === 0){
    app = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        })
    })
}else{
    app = getApp()
}

const adminDb = getFirestore(app)
const adminStorage = getStorage(app) 

export {app as adminApp, adminDb, adminStorage}