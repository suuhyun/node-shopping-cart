const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const auth = require('../config/auth')
const isAdmin = auth.isAdmin


// Get Page model
const Category = require('../models/category')

/*
 * GET category index
 */

router.get('/', isAdmin, (req, res) => {
    Category.find((err, categories) => {
        if (err) return console.log(err)
        res.render('admin/categories', {
            categories: categories
        })
    })
})

/*
 * GET add category
 */

router.get('/add-category', isAdmin, (req, res) => {
    
    const title = ""

    res.render('admin/add_category', {
        title: title,
    })
})

/*
 * POST add category
 */

router.post('/add-category', [
    body('title').notEmpty().withMessage('Title must have a value.'),
], (req, res) => {

    const title = req.body.title
    let slug = title.replace(/\s+/g, '-').toLowerCase()

    const errors = validationResult(req).errors

    if (errors.length != 0) {
        res.render('admin/add_category', {
            errors: errors,
            title: title
        })
    } else {
        Category.findOne({ slug: slug }, (error, category) => {
            if (category) {
                req.flash('danger', 'Category title exists, choose another.')
                res.render('admin/add_category', {
                    title: title
                })
            } else {
                let category = new Category({
                    title: title,
                    slug: slug
                })

                category.save((error) => {
                    if (error) return console.log(error)

                    Category.find((err, categories) => {
                        if (err) {
                            console.log(err)
                        } else {
                            req.app.locals.categories = categories
                        }
                    })
                    
                    req.flash('success', 'Category added!')
                    res.redirect('/admin/categories')
                })
            }
        })
    }

})

/*
 * GET edit category
 */

router.get('/edit-category/:id', isAdmin, (req, res) => {
    
    Category.findById(req.params.id, (err, category) => {
        if (err) return console.log(err)

        res.render('admin/edit_category',{
            title: category.title,
            id: category._id
        })
    })
})

/*
 * POST edit category
 */

router.post('/edit-category/:id', [
    body('title').notEmpty().withMessage('Title must have a value.'),
], (req, res) => {

    const title = req.body.title
    let slug = title.replace(/\s+/g, '-').toLowerCase()
    const id = req.params.id

    const errors = validationResult(req).errors

    if (errors.length != 0) {
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id
        })
    } else {
        Category.findOne({ slug: slug, _id: { '$ne': id } }, (error, category) => {
            if (category) {
                req.flash('danger', 'Category title exists, choose another.')
                res.render('admin/edit_category', {
                    title: title,
                    id: id
                })
            } else {
                Category.findById(id, (err, category) => {
                    if (err) return console.log(err)
                    
                    category.title = title,
                    category.slug = slug,
                    
                    category.save((error) => {
                        if (error) return console.log(error)

                        Category.find((err, categories) => {
                            if (err) {
                                console.log(err)
                            } else {
                                req.app.locals.categories = categories
                            }
                        })
                        
                        req.flash('success', 'Category editted!')
                        res.redirect('/admin/categories/edit-category/' + id)
                    })
                })
            }
        })
    }

})

/*
 * GET delete category
 */

router.get('/delete-category/:id', isAdmin, (req, res) => {
    Category.findByIdAndRemove(req.params.id, err => {
        if (err) return console.log(err)

        Category.find((err, categories) => {
            if (err) {
                console.log(err)
            } else {
                req.app.locals.categories = categories
            }
        })        

        req.flash('success', 'Category deleted!')
        res.redirect('/admin/categories')
    })
})

// Exports
module.exports = router