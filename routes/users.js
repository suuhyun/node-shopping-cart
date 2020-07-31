const express = require('express')
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcrypt')
const { body, validationResult } = require('express-validator')


// Get User model
const User = require('../models/user')


/*
 * GET register
 */
router.get('/register', (req, res) => {

    res.render('register', {
        title: 'Register'
    })
})

/*
 * POST register
 */
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required!'),
    body('email').notEmpty().withMessage('Email is required!'),
    body('username').notEmpty().withMessage('Username is required!'),
    body('password').notEmpty().withMessage('Password is required!'),
    body('password2').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match')
        }

        return true
    })
], (req, res) => {

    const name = req.body.name
    const email = req.body.email
    const username = req.body.username
    const password = req.body.password
    const password2 = req.body.password2

    const errors = validationResult(req).errors

    if (errors.length != 0) {
        res.render('register', {
            errors: errors,
            user: null,
            title: 'Register'
        })
    } else {
        User.findOne({username: username}, (err, user) => {
            if (err) console.log(err)
            if (user) {
                req.flash('danger', 'Username exists, choose another!')
                res.redirect('/users/register')
            } else {
                const user = new User ({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: 0
                })

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(user.password, salt, (err, hash) => {
                        if (err) console.log(err)

                        user.password = hash

                        user.save(err => {
                            if (err) {
                                console.log(err)
                            } else {
                                req.flash('success', 'You are now registered!')
                                res.redirect('/users/login')
                            }
                        })
                    })
                })
            }
        })
    }
})

/*
 * GET login
 */
router.get('/login', (req, res) => {

    if (res.locals.user) res.redirect('/')

    res.render('login', {
        title: 'Log in'
    })
})

/*
 * POST login
 */
router.post('/login', (req, res, next) => {

    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next)
})

/*
 * GET logout
 */
router.get('/logout', (req, res) => {

    req.logout()

    req.flash('success', 'You are logged out!')
    res.redirect('/users/login')
})



// Exports
module.exports = router