const express = require('express')
const router = express.Router()

// Get Product model
const Product = require('../models/product')

/*
 * GET add product to cart
 */
router.get('/add/:product', (req, res) => {

    const slug = req.params.product

    Product.findOne({slug: slug}, (err, p) => {
        if (err) console.log(err)
        
        if (typeof req.session.cart == "undefined") {
            req.session.cart = []
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.image
            })
        } else {
            const cart = req.session.cart
            let newItem = true

            for (let i = 0; i < cart.length; i++) {
                if ( cart[i].title == slug ) {
                    cart[i].qty++
                    newItem = false
                    break
                }
            }
            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.image
                })
            }
        }

        req.flash('success', 'Product added!')
        res.redirect('back')
    })
})

/*
 * GET checkout page
 */
router.get('/checkout', (req, res) => {
    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart
        res.redirect('/cart/checkout')
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        })
    }
})

/*
 * GET update product
 */
router.get('/update/:product', (req, res) => {
    const slug = req.params.product
    const cart = req.session.cart
    const action = req.query.action

    for (let i = 0; i < cart.length; i++) {
        if (cart[i].title == slug) {
            switch(action) {
                case "add":
                    cart[i].qty++
                    break
                case "remove":
                    cart[i].qty--
                    if (cart[i].qty < 1) cart.splice(i, 1)
                    break
                case "clear":
                    cart.splice(i, 1)
                    if (cart.length == 0) delete req.session.cart
                    break
                default:
                    console.log('update problem')
                    break
            }
            break
        }
    }
    req.flash('success', 'Cart updated!')
    res.redirect('/cart/checkout')
})

/*
 * GET clear page
 */
router.get('/clear', (req, res) => {
    delete req.session.cart

    req.flash('success', 'Cart cleared')
    res.redirect('/cart/checkout')
})

/*
 * GET buy now
 */
router.get('/buynow', (req, res) => {

    delete req.session.cart

    res.sendStatus(200)
})

// Exports
module.exports = router