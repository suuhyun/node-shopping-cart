const mongoose = require('mongoose')

// Product Schema
const ProductSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
    },
    desc: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
    },
    image: {
        type: String,
    }
})

const Page = module.exports = mongoose.model('Product', ProductSchema)