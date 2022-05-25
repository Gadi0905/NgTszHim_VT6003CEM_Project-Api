// dotenv
require('dotenv').config()
// cors
var cors = require('cors')
// express
const express = require('express')
// bodyParser
const bodyParser = require('body-parser')
// mysql
const mysql = require('mysql')
// jsonwebtoken
const jwt = require('jsonwebtoken')
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

// *********************************************************************************************************************************************************************
// refreshTokens
let refreshTokens = []
// login
app.post('/login', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        const { email, password } = req.body

        connection.query('SELECT * FROM employee WHERE email = ? AND password = ?', [email, password], (err, rows) => {
            connection.release()    // return the connection to pool
            if (!err) {
                if (rows.length === 0) {
                    res.send('no user')
                } else {
                    const user = { email: rows.email, password: rows.password }

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

// posts
app.get('/posts', authenticateToken, (req, res) => {
    res.send('login ok')
})
// refreshToken to get accessToken
app.post('/token', (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401)
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = generateAccessToken({ email: user.email, password: user.password })
        res.json({ accessToken: accessToken })
    })
})

// logout
app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
})

// authenticate Token
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

// generate Access Token
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
}

// *********************************************************************************************************************************************************************

// get all employee record
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

// get a employee record by id
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

// delete a employee record by id
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

// insert a employee record
app.post('/employee', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        const params = req.body

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

// update a employee record
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

// get all dog ASC record
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

// get all dog Desc record
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

// get a dog record by id
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

// delete a dog record by id
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

// insert a dog record
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

// update a dog record
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
app.listen(port, () => console.log(`listen on port ${port}`))