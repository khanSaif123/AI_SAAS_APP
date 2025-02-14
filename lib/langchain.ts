import {ChatOpenAI} from "@langchain/openai"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {OpenAIEmbeddings} from "@langchain/openai"
import {createStuffDocumentsChain} from "langchain/chains/combine_documents"
import {ChatPromptTemplate} from "@langchain/core/prompts"
import {createRetrievalChain} from "langchain/chains/retrieval"
import {createHistoryAwareRetriever} from "langchain/chains/history_aware_retriever"
import {HumanMessage, AIMessage} from "@langchain/core/messages"
import pineconeClient from "./pinecone"
import {PineconeStore} from "@langchain/pinecone"
import {PineconeConflictError} from "@pinecone-database/pinecone/dist/errors"
import {Index, RecordMetadata} from "@pinecone-database/pinecone"
import {adminDb} from "../firebaseAdmin"
import {auth} from "@clerk/nextjs/server"


const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
    modelName: "gpt-4o",
});

export const indexName = "chatwithpdf"

// generate doc func
export async function generateDocs(docId: string){
    const {userId} = await auth() // we check u are authenticated.

    if(!userId){
        throw new Error("User not found")
    }

    console.log("--- Fetch to download URL from firebase.. ---")
    const firebaseRef = await adminDb.collection("users")
    .doc(userId)
    .collection("file")
    .doc(docId)
    .get();

    const downloadUrl = firebaseRef.data()?.downloadUrl

    if(!downloadUrl){
        throw new Error("Download URL not found");
    }

    console.log(`--- download URL fetched successfully: ${downloadUrl}`)
}

async function namespaceExists(index: Index<RecordMetadata>, namespace: string) {
    if(namespace == null) throw new Error("No namespace value provided.")
    
    const {namespaces} = await index.describeIndexStats();

    // Check if the given namespace exists in the retrieved namespaces and return the result
    return namespaces?.[namespace] !== undefined

}

export async function generateEmbrddingsInPineconeVectorStore(docId: string) {
    const {userId} = await auth()
    
    if(!userId){
        throw new Error("User not found")
    } 

    let pineconeVectorStore;

    // when we upload pdf we only gonna generate embedding onces that is why we check nampe space
    // for more efficiency and make it cheep
    console.log("--- Generate embadding for the split documents... ---")
    const embedding = new OpenAIEmbeddings() // this is use for passing input value in and generating those strings of number together.

    const index = await pineconeClient.index(indexName)

    const namespaceAlreadyExists = await namespaceExists(index, docId) // this returns true if the namespace  exists

    if(namespaceAlreadyExists){
        console.log(
            `--- Namespace ${docId} alreadt exists, resuing the existing embedding... ---`
        )

            
        pineconeVectorStore = await PineconeStore.fromExistingIndex(embedding, {
            pineconeIndex: index,
            namespace: docId
        })
        
        return pineconeVectorStore;
    }else{
        // if the namespace does not exists, download the pdf from fireStore via the stored Download URL & 
        // generate the embedding and store then in the Pinecone vector store.
        const splitDocs = await generateDocs(docId)
    }

}