const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const mkdirp = require('mkdirp')
const fs = require('fs-extra')
const resizeImg = require('resize-img')
const path = require('path')
const auth = require('../config/auth')
const isAdmin = auth.isAdmin

// Get Product model
const Product = require('../models/product')

// Get Category model
const Category = require('../models/category')
const product = require('../models/product')

/*
 * GET products index
 */

router.get('/', isAdmin, (req, res) => {
    let count

    Product.count((err, c) => {
        count = c
    })

    Product.find((err, products) => {
        res.render('admin/products', {
            products: products,
            count: count
        })
    })
})

/*
 * GET add product
 */

router.get('/add-product', isAdmin, (req, res) => {
    
    const title = ""
    const desc = ""
    const price = ""

    Category.find((err, cat) => {
        res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories: cat,
            price: price
        })
    })
})

/*
* POST add product
*/

router.post('/add-product', [
    body('title').notEmpty().withMessage('Title must have a value.'),
    body('desc').notEmpty().withMessage('Description must have a value.'),
    body('price').isDecimal().withMessage('Price must have a value.'),
    body('image').custom((value, { req }) => {
            const fileName = req.files != undefined ? req.files.image.name : ""
            const extension = (path.extname(fileName)).toLowerCase()
            switch(extension) {
                case '.jpg':
                    return '.jpg'
                case '.jpeg':
                    return '.jpeg'
                case '.png':
                    return '.png'
                case '':
                    return '.jpg'
                default:
                    return false
            }
        }).withMessage('You must upload an image')
], (req, res) => {
    const title = req.body.title
    const desc = req.body.desc
    const price = req.body.price
    const category = req.body.category
    const slug = req.body.title.replace(/\s+/g, '-').toLowerCase()

    const errors = validationResult(req).errors
    if (errors.length != 0) {
        Category.find((err, cat) => {
            res.render('admin/add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: cat,
                price: price
            })
        })
    } else {
        const imageFile = req.files != undefined ? req.files.image.name : ""
        Product.findOne({ slug: slug }, (error, product) => {
            if (product) {
                req.flash('danger', 'Product title exists, choose another.')
                Category.find((err, cat) => {
                    res.render('admin/add_product', {
                        title: title,
                        desc: desc,
                        categories: cat,
                        price: price
                    })
                })
            } else {

                const price2 = parseFloat(price).toFixed(2)
                const product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: price2,
                    category: category,
                    image: imageFile
                })

                product.save((error) => {
                    if (error) return console.log(error)
                    
                    mkdirp('public/product_images/' + product._id)
                    mkdirp('public/product_images/' + product._id + '/gallery')
                    mkdirp('public/product_images/' + product._id + '/gallery/thumbs')
                    if (imageFile != '') {
                        const productImage = req.files.image
                        const imagePath = 'public/product_images/' + product._id + '/' + imageFile                 
                        productImage.mv(imagePath, (e) => console.log(e))
                    }
                    req.flash('success', 'Product added!')
                    res.redirect('/admin/products')
                })
            }
        })
    }

})


/*
 * GET edit product
 */

router.get('/edit-product/:id', isAdmin, (req, res) => {
    
    let errors

    if (req.session.errors) {
        error = req.session.errors
    }
    req.session.errors = null

    Category.find((err, cat) => {

        Product.findById(req.params.id, (err, p) => {
            if (err) {
                console.log(err)
                res.redirect('/admin/products')
            } else {
                const galleryDir = 'public/product_images/' + p._id + '/gallery'
                let galleryImages = null
                
                fs.readdir(galleryDir, (err, files) => {
                    if (err) {
                        console.log(err)
                    } else {
                        galleryImages = files

                        res.render('admin/edit_product', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: cat,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(p.price).toFixed(2),
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        })
                    }
                })
            }
        })

        
    })

})

/*
 * POST edit product
 */

router.post('/edit-product/:id', [
    body('title').notEmpty().withMessage('Title must have a value.'),
    body('desc').notEmpty().withMessage('Description must have a value.'),
    body('price').isDecimal().withMessage('Price must have a value.'),
    body('image').custom((value, { req }) => {
            const fileName = req.files != undefined ? req.files.image.name : ""
            const extension = (path.extname(fileName)).toLowerCase()
            switch(extension) {
                case '.jpg':
                    return '.jpg'
                case '.jpeg':
                    return '.jpeg'
                case '.png':
                    return '.png'
                case '':
                    return '.jpg'
                default:
                    return false
            }
        }).withMessage('You must upload an image')
], (req, res) => {
    const title = req.body.title
    const desc = req.body.desc
    const price = req.body.price
    const category = req.body.category
    const slug = req.body.title.replace(/\s+/g, '-').toLowerCase()
    const pimage = req.body.pimage
    const id = req.params.id

    const errors = validationResult(req).errors

    if (errors.length != 0) {
        req.sessions.errors = errors
        res.redirect('/admin/products/edit-product/' + id)
    } else {
        const imageFile = req.files != undefined ? req.files.image.name : ""
        Product.findOne({slug: slug, _id: {'$ne':id}}, (err, p) => {
            if (err) console.log(err)
            if (p) {
                req.flash('danger', 'Product title exists, choose another.')
                res.redirect('/admin/products/edit-product/' + id)
            } else {
                Product.findById(id, (err, p) => {
                    if (err) console.log(err)
                    
                    p.title = title
                    p.slug = slug
                    p.desc = desc
                    p.price = parseFloat(price).toFixed(2)
                    p.category = category
                    if (imageFile != "") {
                        p.image = imageFile
                    }

                    p.save(err => {
                        if (err) console.log(err)

                        if (imageFile != "") {
                            if (pimage != "") {
                                fs.remove('public/product_images/' + id + '/' + pimage, (err) => {
                                    if (err) console.log(err)
                                })
                            }

                            const productImage = req.files.image
                            const imagePath = 'public/product_images/' + id + '/' + imageFile                 
                            productImage.mv(imagePath, (e) => console.log(e))
                        }

                        req.flash('success', 'Product editted!')
                        res.redirect('/admin/products/edit-product/' + id)
                    })
                })
            }
        })
    }
})

/*
 * POST product gallery
 */

router.post('/product-gallery/:id', (req, res) => {
    const productImage = req.files.file
    const id = req.params.id
    const path = 'public/product_images/' + id + '/gallery/' + req.files.file.name
    const thumbPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name

    productImage.mv(path, (err) => {
        if (err) console.log(err)

        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(buf => {
            fs.writeFileSync(thumbPath, buf)
        })
    })

    res.status(200).send()
})

/*
 * GET delete image
 */

router.get('/delete-image/:image', isAdmin, (req, res) => {

    const originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image
    const thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image

    fs.remove(originalImage, (err) => {
        if (err) {
            console.log(err)
        } else {
            fs.remove(thumbImage, (err) => {
                if (err) {
                    console.log(err)
                } else {
                    req.flash('success', 'Image deleted!')
                    res.redirect('/admin/products/edit-product/' + req.query.id)
                }
            })
        }
    })
})

/*
 * GET delete product
 */

router.get('/delete-product/:id', isAdmin, (req, res) => {
    const id = req.params.id
    const path = 'public/product_images/' + id

    fs.remove(path, (err) => {
        if (err) {
            console.log(err)
        } else {
            Product.findByIdAndRemove(id, (err) => console.log(err))

            req.flash('success', 'Product deleted!')
            res.redirect('/admin/products')
        }
    })
})

// Exports
module.exports = router