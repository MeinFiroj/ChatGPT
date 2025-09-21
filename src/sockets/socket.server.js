const { Server } = require("socket.io")
const aiServices = require("../services/ai.service")
const Cookie = require("cookie")
const jwt = require('jsonwebtoken')
const userModel = require("../models/user.model")
const messageModel = require("../models/message.model")

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

            await messageModel.create({
                user: socket.user._id,
                chat: messagePayload.chat,
                content: messagePayload.content,
                role: 'user'
            })
            
            // retrieving 10 messages from db 
            const chatHistory = (await messageModel.find({
                chat : messagePayload.chat
            }).sort({createdAt : -1}).limit(10).lean()).reverse()

            // mapping chathistory to get suitable object to give to ai
            const chatHistoryMapped = chatHistory.map(msg=>{
                return {
                    role : msg.role,
                    parts : [{text : msg.content}]
                }
            })

            const response = await aiServices.generateResponse(chatHistoryMapped)

            await messageModel.create({
                user: socket.user._id,
                chat: messagePayload.chat,
                content: response,
                role: "model"
            })

            socket.emit("ai-response", {
                content : response,
                chat : messagePayload.chat
            })
        })


    })
}
module.exports = initSocketServer;