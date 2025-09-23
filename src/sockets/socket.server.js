const { Server } = require("socket.io")
const aiServices = require("../services/ai.service")
const Cookie = require("cookie")
const jwt = require('jsonwebtoken')
const userModel = require("../models/user.model")
const messageModel = require("../models/message.model")
const { createMemory, queryMemory } = require("../services/vector.service")

function initSocketServer(httpServer) {
    const io = new Server(httpServer, { /* options */ });

    io.use(async (socket, next) => {
        const cookie = Cookie.parse(socket.handshake.headers?.cookie || "")
        if (!cookie.token) {
            next(new Error("Authentication error : No token provided"))
        }

        try {
            const decoded = jwt.verify(cookie.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            socket.user = user
            next()
        } catch (error) {
            next(new Error("Authentication error : Invalid token"))
        }
    })

    io.on("connection", (socket) => {
        console.log("New socket connected,", socket.id)

        socket.on('ai-message', async (messagePayload) => {

            const [message, vectors] = await Promise.all([
                messageModel.create({
                    user: socket.user._id,
                    chat: messagePayload.chat,
                    content: messagePayload.content,
                    role: 'user'
                }),
                aiServices.generateVector(messagePayload.content)
            ])

            const [memory, chatHistory] = await Promise.all([
                queryMemory({
                    vectors,
                    limit: 3,
                    metadata: {
                        user: socket.user._id
                    }
                }),
                messageModel.find({
                    chat: messagePayload.chat
                }).sort({ createdAt: -1 }).limit(10).lean().then(messages => messages.reverse()),
                createMemory({
                    vectors,
                    id: message._id,
                    metadata: {
                        text: messagePayload.content,
                        chat: messagePayload.chat,
                        user: socket.user._id,
                    }
                })
            ])


            const stm = chatHistory.map(msg => {
                return {
                    role: msg.role,
                    parts: [{ text: msg.content }]
                }
            })

            const ltm = [
                {
                    role: "user",
                    parts: [{
                        text: `
                        these are some previous messages from the chat, use them to generate response
                        ${memory.map(item => item.metadata.text).join('\n')}
                        `
                    }]
                }
            ]

            const response = await aiServices.generateResponse([...ltm, ...stm])

            socket.emit("ai-response", {
                content: response,
                chat: messagePayload.chat
            })


            const [responseMessage, responseVectors] = await Promise.all([
                messageModel.create({
                    user: socket.user._id,
                    chat: messagePayload.chat,
                    content: response,
                    role: "model"
                }),
                aiServices.generateVector(response)
            ])

            await createMemory({
                vectors: responseVectors,
                id: responseMessage._id,
                metadata: {
                    text: response,
                    chat: messagePayload.chat,
                    user: socket.user._id
                },
            })
        })


    })
}
module.exports = initSocketServer;