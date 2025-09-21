const express = require("express")
const authMiddlewares = require("../middlewares/auth.middleware")
const chatControllers = require('../controllers/chat.controllers')


const router = express.Router()

router.post('/', authMiddlewares.authUser, chatControllers.createChat)




module.exports = router;