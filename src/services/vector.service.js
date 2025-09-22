const { Pinecone } = require('@pinecone-database/pinecone')

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const chatGptIndex = pc.Index("project-chat-gpt")

async function createMemory({vectors, metadata, id}) {
    await chatGptIndex.upsert([{
        id,
        values : vectors,
        metadata
    }])
}

async function queryMemory({vectors, limit = 5, metadata}) {
    const data = await chatGptIndex.query({
        topK : limit,
        vector : vectors,
        filter : metadata? {metadata} : undefined,
        includeMetadata : true
    })

    return data.matches;
}


module.exports = {
    createMemory, queryMemory
}
