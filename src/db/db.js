const mongoose = require("mongoose")

async function dbConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Database connected successfully')
    } catch (error) {
        console.log("Databse connection error ----> ", error)
    }
}

module.exports = dbConnection;