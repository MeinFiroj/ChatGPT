const { Server } = require("socket.io");


function socketServer(httpServer) {
    const io = new Server(httpServer, { /* options */ });

    io.on("connection", (socket) => {
        console.log('new socket connected', socket.id)
    });
}

module.exports = socketServer;