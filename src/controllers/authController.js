const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')

async function registerUser(req, res) {
    const { email, password, fullName: { firstName, lastName } } = req.body

    const isUserExist = await userModel.findOne({ email })

    if (isUserExist) {
        return res.status(400).json({
            message: "User already exists"
        })
    }

    const hashPass = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        email, fullName: { firstName, lastName },
        password: hashPass
    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    res.cookie('token', token)
    res.status(201).json({
        message: "user registered successfully",
        user : {
            email : user.email,
            fullName : user.fullName
        }
    })
}

async function loginUser (req,res){
    const {email, password} = req.body

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(400).json({
            message : "Invalid email or password"
        })
    }

    const validPass = await bcrypt.compare(password, user.password)

    if(!validPass){
        return res.status(400).json({
            message : "Invalid email or password"
        })
    }

    const token = jwt.sign({id : user._id}, process.env.JWT_SECRET)
    res.cookie('token', token)

    res.status(200).json({
        message : "User logged in successfully",
        user : {
            email : user.email,
            fullName : user.fullName
        }
    })
}




module.exports = {
    registerUser,
    loginUser
}