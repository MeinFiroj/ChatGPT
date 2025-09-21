const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")



async function registerUser(req, res) {
    const { email, password, fullName: { firstName, lastName } } = req.body;

    const userExists = await userModel.findOne({ email })
    if (userExists) {
        return res.status(400).json({
            message: "User already exists."
        })
    }

    const hashPass = await bcrypt.hash(password, 10)
    const user = await userModel.create({
        email, fullName: { firstName, lastName }, password: hashPass
    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie('token', token)

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName
        }
    })
}

async function loginUser(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(401).json({
            message: 'Invalid email or password'
        })
    }

    const passChecking = await bcrypt.compare(password, user.password)

    if (!passChecking) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie('token', token)

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName
        }
    })

}

async function logoutUser(req, res) {
    res.cookie("token", null)
    res.status(200).json({
        message: "User logged out successfully"
    })
}


module.exports = {
    registerUser, loginUser, logoutUser
}