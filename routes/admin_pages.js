const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const auth = require('../config/auth')
const isAdmin = auth.isAdmin

// Get Page model
const Page = require('../models/page')

/*
 * GET pages index
 */

router.get('/', isAdmin, (req, res) => {
    Page.find({}).sort({sorting: 1}).exec((err, pages) => {
        res.render('admin/pages', {
            pages: pages
        })
    })
})

/*
 * GET add page
 */

router.get('/add-page', isAdmin, (req, res) => {
    
    const title = ""
    const slug = ""
    const content = ""

    res.render('admin/add_page', {
        title: title,
        slug: slug,
        content: content
    })
})

/*
 * POST add page
 */

router.post('/add-page', [
    body('title').notEmpty().withMessage('Title must have a value.'),
    body('content').notEmpty().withMessage('Content must have a value.')
], (req, res) => {

    const title = req.body.title
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase()
    if (!slug) {
        slug = title.replace(/\s+/g, '-').toLowerCase()
    }
    const content = req.body.content

    const errors = validationResult(req).errors

    if (errors.length != 0) {
        res.render('admin/add_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content
        })
    } else {
        Page.findOne({ slug: slug }, (error, page) => {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another.')
                res.render('admin/add_page', {
                    title: title,
                    slug: slug,
                    content: content
                })
            } else {
                let page = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 100
                })

                page.save((error) => {
                    if (error) return console.log(error)

                    Page.find({}).sort({sorting: 1}).exec((err, pages) => {
                        if (err) {
                            console.log(err)
                        } else {
                            req.app.locals.pages = pages
                        }
                    })

                    req.flash('success', 'Page added!')
                    res.redirect('/admin/pages')
                })
            }
        })
    }

})

// Sort pages function
sortPages = (ids, callback) => {
    let count = 0

    for (let i=0; i < ids.length; i++) {
        let id = ids[i]
        count++

        (count => {
            Page.findById(id, (err, page) => {
                page.sorting = count
                page.save(err => {
                    if (err) return console.log(err)
                    ++count
                    if (count >= ids.length) {
                        callback()
                    }
                })
            })
        }) (count)
        
    }
}

/*
 * POST reorder pages
 */

router.post('/reorder-pages', (req, res) => {
    const ids = req.body['id[]']

    sortPages(ids, () => {
        Page.find({}).sort({sorting: 1}).exec((err, pages) => {
            if (err) {
                console.log(err)
            } else {
                req.app.locals.pages = pages
            }
        })
    })

})

/*
 * GET edit page
 */

router.get('/edit-page/:id', isAdmin, (req, res) => {
    
    Page.findById(req.params.id, (err, page) => {
        if (err) return console.log(err)

        res.render('admin/edit_page',{
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        })
    })
})

/*
 * POST edit page
 */

router.post('/edit-page/:id', [
    body('title').notEmpty().withMessage('Title must have a value.'),
    body('content').notEmpty().withMessage('Content must have a value.')
], (req, res) => {

    const title = req.body.title
    let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase()
    if (!slug) {
        slug = title.replace(/\s+/g, '-').toLowerCase()
    }
    const content = req.body.content
    const id = req.params.id

    const errors = validationResult(req).errors

    if (errors.length != 0) {
        res.render('admin/edit_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        })
    } else {
        Page.findOne({ slug: slug, _id: { '$ne': id } }, (error, page) => {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another.')
                res.render('admin/edit_page', {
                    title: title,
                    slug: slug,
                    content: content,
                    id: id
                })
            } else {
                Page.findById(id, (err, page) => {
                    if (err) return console.log(err)
                    
                    page.title = title,
                    page.slug = slug,
                    page.content = content
                    
                    page.save((error) => {
                        if (error) return console.log(error)

                        Page.find({}).sort({sorting: 1}).exec((err, pages) => {
                            if (err) {
                                console.log(err)
                            } else {
                                req.app.locals.pages = pages
                            }
                        })

                        req.flash('success', 'Page edited!')
                        res.redirect('/admin/pages/edit-page/' + id)
                    })
                })
            }
        })
    }

})

/*
 * GET delete page
 */

router.get('/delete-page/:id', isAdmin, (req, res) => {
    Page.findByIdAndRemove(req.params.id, err => {
        if (err) return console.log(err)

        Page.find({}).sort({sorting: 1}).exec((err, pages) => {
            if (err) {
                console.log(err)
            } else {
                req.app.locals.pages = pages
            }
        })

        req.flash('success', 'Page deleted!')
        res.redirect('/admin/pages')
    })
})

// Exports
module.exports = router