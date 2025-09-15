const chatModel = require("../models/chat.model");
const userModel = require('../models/user.model')

const jwt = require("jsonwebtoken")

async function authMiddleware (req, res, next){
    const {token} = req.cookies

    if(!token){
        return res.status(401).json({
            message : "Unauthorized user"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findOne({_id : decoded.id})
        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({
            message : "Unauthorized user"
        })
    }
}


module.exports = {
    authMiddleware
}