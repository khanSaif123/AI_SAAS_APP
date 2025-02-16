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
// import {PineconeConflictError} from "@pinecone-database/pinecone/dist/errors"
import {Index, RecordMetadata} from "@pinecone-database/pinecone"
import {adminDb} from "../firebaseAdmin"
import {auth} from "@clerk/nextjs/server"


const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
    modelName: "gpt-4o",
});

export const indexName = "chatwithpdf"

async function fetchMessagesFromDB(docId: string) {
    const {userId} = await auth()

    if(!userId){
        throw new Error("User not found");
    }

    console.log("--- Fetching chat history from the firestore database... ---");
    // Get the last 6 messages from the chat history
    const LIMIT = 6
    const chats = await adminDb
        .collection(`users`)
        .doc(userId)
        .collection("files")
        .doc(docId)
        .collection("chat")
        .orderBy("createdAt", "desc")
        .limit(LIMIT)
        .get();

        const chatHistory = chats.docs.map((doc) =>
            doc.data().role === "human"
              ? new HumanMessage(doc.data().message)
              : new AIMessage(doc.data().message)
        );

        console.log(
            `--- fetched last ${chatHistory.length} messages successfully ---`
        );
        console.log(chatHistory.map((msg) => msg.content.toString()));

        return chatHistory;
}

// generate doc func
export async function generateDocs(docId: string){
    const {userId} = await auth() // we check u are authenticated.

    if(!userId){
        throw new Error("User not found")
    }

    console.log("--- Fetch to download URL from firebase.. ---")
    const firebaseRef = await adminDb.collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .get();

    const downloadUrl = firebaseRef.data()?.downloadUrl

    if(!downloadUrl){
        throw new Error("Download URL not found");
    }

    console.log(`--- download URL fetched successfully: ${downloadUrl}`)

    // download the pdf
    const response = await fetch(downloadUrl)

    // load the PDF into a PDFDocument object.
    const data = await response.blob()

    // load the PDF document from the specified path.
    console.log("--- Loading PDF document... ---")
    const loader = new PDFLoader(data)
    const docs = await loader.load()

    // split the docs into smaller parts for easier processing.
    console.log("--- Splitting the document into smaller parts ---")
    const splitter = new RecursiveCharacterTextSplitter();

    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`--- Split into ${splitDocs.length} parts ---`);

    return splitDocs

}

async function namespaceExists(index: Index<RecordMetadata>, namespace: string) {
    if(namespace == null) throw new Error("No namespace value provided.")
    
    const {namespaces} = await index.describeIndexStats();

    // Check if the given namespace exists in the retrieved namespaces and return the result
    return namespaces?.[namespace] !== undefined

}

export async function generateEmbeddingsPineconeVectorStore(docId: string) {
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
        const splitDocs = await generateDocs(docId);

        console.log(`--- Storing the embedding in namespace ${docId} in the ${indexName} pinecone vector store... ---`)

        // genenrating and storing the documents here.
        pineconeVectorStore = await PineconeStore.fromDocuments(
            splitDocs,
            embedding,
            {
                pineconeIndex: index,
                namespace: docId
            }
        );

        return pineconeVectorStore;
    }

}

const generateLangchainCompletion = async (docId: string, question: string) =>{
    

   const pineconeVectorStore = await generateEmbeddingsPineconeVectorStore(docId);

    if (!pineconeVectorStore) {
        throw new Error("Pinecone vector store not found");
    }

    // Create a retriever to search through the vector store
    console.log("--- Creating a retriever... ---");
    const retriever = pineconeVectorStore.asRetriever();
    
    // Fetch the chat history from the database
    const chatHistory = await fetchMessagesFromDB(docId);

    // Define a prompt template for generating search queries based on conversation history
    console.log("--- Defining a prompt template... ---");
    const historyAwarePrompt = ChatPromptTemplate.fromMessages([
    ...chatHistory, // Insert the actual chat history here

    ["user", "{input}"],
    [
      "user",
      "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
    ],
  ]);

  // Create a history-aware retriever chain that uses the model, retriever, and prompt
  console.log("--- Creating a history-aware retriever chain... ---");
  const historyAwareRetrieverChain = await createHistoryAwareRetriever({
    llm: model,
    retriever,
    rephrasePrompt: historyAwarePrompt,
  });

   // Define a prompt template for answering questions based on retrieved context
   console.log("--- Defining a prompt template for answering questions... ---");
   const historyAwareRetrievalPrompt = ChatPromptTemplate.fromMessages([
     [
       "system",
       "Answer the user's questions based on the below context:\n\n{context}",
     ],
 
     ...chatHistory, // Insert the actual chat history here
 
     ["user", "{input}"],
   ]);

    //  ** -- combining two different chains together 

    // Create a chain to combine the retrieved documents into a coherent response
    console.log("--- Creating a document combining chain... ---");
    const historyAwareCombineDocsChain = await createStuffDocumentsChain({
        llm: model,
        prompt: historyAwareRetrievalPrompt,
    });

    // Create the main retrieval chain that combines the history-aware retriever and document combining chains
    console.log("--- Creating the main retrieval chain... ---");
    const conversationalRetrievalChain = await createRetrievalChain({
        retriever: historyAwareRetrieverChain,
        combineDocsChain: historyAwareCombineDocsChain,
    });

    console.log("--- Running the chain with a sample conversation... ---");
    const reply = await conversationalRetrievalChain.invoke({
        chat_history: chatHistory,
        input: question,
    });

    console.log(reply.answer);
    return reply.answer;
}

// Export the model and the run function
export { model, generateLangchainCompletion };