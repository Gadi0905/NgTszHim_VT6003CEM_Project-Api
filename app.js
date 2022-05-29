// dotenv
require('dotenv').config()
// cors
var cors = require('cors')
// express
const express = require('express')
// bcrypt
const bcrypt = require('bcrypt')
// crypto
var crypto = require('crypto');
// bodyParser
const bodyParser = require('body-parser')
// mysql
const mysql = require('mysql')
// jsonwebtoken
const jwt = require('jsonwebtoken')
// swaggerUi
const swaggerUi = require('swagger-ui-express');
// swaggerJsDoc
const swaggerJsDoc = require('swagger-jsdoc');
// app
const app = express()
// port
const port = process.env.PORT || 5000
// use bodyParser urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// use bodyParser json
app.use(bodyParser.json())
// use express json
app.use(express.json())
// use cors
app.use(cors())

// mysql
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'secret',
    database: 'vt6003cem_webapi',
})

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Dog API",
            version: "1.0.0",
            description: "A simple API"
        },
        servers: [
            {
                url: "http://localhost:5000"
            }
        ]
    },
    apis: ["./app.js"]
}

const specs = swaggerJsDoc(options)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

 /**
  * @swagger
  * tags:
  *   name: Tokens
  *   description: The Tokens managing API
  */

 /**
  * @swagger
  * tags:
  *   name: Employees
  *   description: The Employees managing API
  */

  /**
  * @swagger
  * tags:
  *   name: Dogs
  *   description: The Dogs managing API
  */

// *********************************************************************************************************************************************************************
// refreshTokens
let refreshTokens = []
/**
 * @function /login post
 * @description Log in function using the data entered in the front end.
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in function using the data entered in the front end.
 *     tags: [Tokens]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: Log in function using the data entered in the front end.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.post('/login', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        const { email, password } = req.body

        const hashPwd = crypto.createHash('sha512').update(password).digest('hex');

        connection.query('SELECT * FROM employee WHERE email = ? AND password = ?', [email, hashPwd], (err, rows) => {
            connection.release()    // return the connection to pool
            if (!err) {
                if (rows.length === 0) {
                    res.send('no user')
                } else {
                    const user = { email: rows.email }

                    const accessToken = generateAccessToken(user)
                    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
                    res.json({ accessToken: accessToken })
                }
            } else {
                console.log(err)
            }
        })
    })
})
/**
 * @function /posts get
 * @description Validate the token and return the validation result to the front end.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Validate the token and return the validation result to the front end.
 *     tags: [Tokens]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             token:
 *               type: string
 *     responses:
 *       200:
 *         description: Validate the token and return the validation result to the front end.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.get('/posts', authenticateToken, (req, res) => {
    res.send('login ok')
})
/**
 * @function /token get
 * @description Use the refresh_Token given by the user to obtain access_Token
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /token:
 *   get:
 *     summary: Use the refresh_Token given by the user to obtain access_Token
 *     tags: [Tokens]
 *     responses:
 *       200:
 *         description: Use the refresh_Token given by the user to obtain access_Token
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.get('/token', (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401)
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = generateAccessToken({ email: user.email, password: user.password })
        res.json({ accessToken: accessToken })
    })
})

/**
 * @function /logout delete
 * @description logout function 
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /logout:
 *   delete:
 *     summary: logout function 
 *     tags: [Tokens]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             token:
 *               type: string
 *     responses:
 *       200:
 *         description: logout function 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
})

/**
 * @function authenticateToken
 * @description authenticate Token
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

/**
 * @function generateAccessToken
 * @description generate Access Token
 * @param {Object} user Request data passed from the frontend.
 * @returns {String} Return access_Token.
 */
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
}

// *********************************************************************************************************************************************************************

/**
 * @function /employee get
 * @description get all employee record
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /employee:
 *   get:
 *     summary: get all employee record
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: get all employee record
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.get('/employee', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('SELECT * FROM employee', (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

/**
 * @function /employee get
 * @description get a employee record by id
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /employee/:id:
 *   get:
 *     summary: get a employee record by id
 *     tags: [Employees]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             id:
 *               type: string
 *     responses:
 *       200:
 *         description: get a employee record by id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.get('/employee/:id', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('SELECT * FROM employee WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

/**
 * @function /employee/:id delete
 * @description delete a employee record by id
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /employee/:id:
 *   delete:
 *     summary: delete a employee record by id
 *     tags: [Employees]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             id:
 *               type: string
 *     responses:
 *       200:
 *         description: delete a employee record by id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.delete('/employee/:id', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('DELETE FROM employee WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(`employee with the record id:${[req.params.id]} has been removed.`)
            } else {
                console.log(err)
            }
        })
    })
})

/**
 * @function /employee post
 * @description insert a employee record
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /employee:
 *   post:
 *     summary: insert a employee record
 *     tags: [Employees]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             email:
 *               type: string
 *             name:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: insert a employee record
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.post('/employee', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        const params = req.body
        params.password = crypto.createHash('sha512').update(params.password).digest('hex');

        connection.query('INSERT INTO employee SET ?', params, (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(`employee with the record name:${[params.name]} has been added.`)
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

/**
 * @function /employee put
 * @description update a employee record
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /employee:
 *   put:
 *     summary: update a employee record
 *     tags: [Employees]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             age:
 *               type: string
 *             sex:
 *               type: string
 *             image:
 *               type: string
 *     responses:
 *       200:
 *         description: update a employee record
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.put('/employee', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        const { id, name, age, sex, image, sign_up_code } = req.body

        connection.query('UPDATE employee SET name = ?, age = ?, sex = ?, image = ?, sign_up_code = ? WHERE id = ?', [name, age, sex, image, sign_up_code, id], (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(`employee with the record name:${[name]} has been updated.`)
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

// *********************************************************************************************************************************************************************

/**
 * @function /dogASC get
 * @description get all dog ASC record
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /dogASC:
 *   get:
 *     summary: get all dog ASC record
 *     tags: [Dogs]
 *     responses:
 *       200:
 *         description: get all dog ASC record
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.get('/dogASC', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('SELECT * FROM dog ORDER BY age ASC', (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

/**
 * @function /dogDESC get
 * @description get all dog Desc record
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /dogDESC:
 *   get:
 *     summary: get all dog Desc record
 *     tags: [Dogs]
 *     responses:
 *       200:
 *         description: get all dog Desc record
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.get('/dogDESC', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('SELECT * FROM dog ORDER BY age DESC', (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

/**
 * @function /dog/:name get
 * @description get a dog record by id
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /dog/:name:
 *   get:
 *     summary: get a dog record by id
 *     tags: [Dogs]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             name:
 *               type: string
 *     responses:
 *       200:
 *         description: get a dog record by id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.get('/dog/:name', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('SELECT * FROM dog WHERE name = ?', [req.params.name], (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

/**
 * @function /dog/:id delete
 * @description delete a dog record by id
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /dog/:id:
 *   delete:
 *     summary: delete a dog record by id
 *     tags: [Dogs]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             id:
 *               type: string
 *     responses:
 *       200:
 *         description: delete a dog record by id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.delete('/dog/:id', authenticateToken, (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('DELETE FROM dog WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(`dog with the record id:${[req.params.id]} has been removed.`)
            } else {
                console.log(err)
            }
        })
    })
})

/**
 * @function /dog post
 * @description insert a dog record
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /dog:
 *   post:
 *     summary: insert a dog record
 *     tags: [Dogs]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             name:
 *               type: string
 *             age:
 *               type: string
 *             sex:
 *               type: string
 *     responses:
 *       200:
 *         description: insert a dog record
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.post('/dog', authenticateToken, (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        const params = req.body

        connection.query('INSERT INTO dog SET ?', params, (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(`dog with the record name:${[params.name]} has been added.`)
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

/**
 * @function /dog put
 * @description update a dog record
 * @param {Object} req Request data passed from the frontend.
 * @param {Object} res Waiting for response data passed to the frontend.
 */

/**
 * @swagger
 * /dog:
 *   put:
 *     summary: update a dog record
 *     tags: [Dogs]
 *     requestBody:
 *       description: request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             age:
 *               type: string
 *             sex:
 *               type: string
 *             image:
 *               type: string
 *     responses:
 *       200:
 *         description: update a dog record
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
app.put('/dog', authenticateToken, (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        const { id, name, age, sex, image } = req.body

        connection.query('UPDATE dog SET name = ?, age = ?, sex = ?, image = ? WHERE id = ?', [name, age, sex, image, id], (err, rows) => {
            connection.release()    // return the connection to pool

            if (!err) {
                res.send(`dog with the record name:${[name]} has been updated.`)
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

// listen on env port or 5000
// app.listen(port, () => console.log(`listen on port ${port}`))

module.exports = app.listen(port, () => console.log(`listen on port ${port}`))
