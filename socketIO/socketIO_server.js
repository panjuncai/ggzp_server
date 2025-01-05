var cors = require("cors");
// 启动 socket.io 服务的函数
module.exports = function (server) {
    // 引入操作 chats 集合数据的 Model
    const ChatModel = require('../db/models').ChatModel
    // 得到操作服务器端 sokectIO 的 io 对象
    const io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            transports: ["websocket","polling"],
            credentials: true
        },
        allowEIO3: true
    })

    // 绑定监听回调: 客户端连接上服务器
    io.on('connection', function (socket) {
        console.log('有客户端连接上了服务器')
        // 绑定 sendMsg 监听, 接收客户端发送的消息
        socket.on('sendMessage', async function ({from, to, content}) {
            console.log('服务器接收到数据', {from, to, content})
            // 将接收到的消息保存到数据库
            const chat_id = [from, to].sort().join('_')
            const create_time = Date.now()
            const chatMsg = {chat_id, from, to, create_time, content}
            const newChat = new ChatModel(chatMsg)
            const savedChat=await newChat.save()
            // 保存完成后, 向所有连接的客户端发送消息
            io.emit('receiveMessage',savedChat) // 全局发送, 所有连接的客户端都可以收到
            console.log('向所有连接的客户端发送消息',savedChat)
        })
    })
}