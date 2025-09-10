const mongoose = require('mongoose');


async function connectDB() {
const uri =  'mongodb://localhost:27017';
await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log('MongoDB connected');
}


module.exports = { connectDB };