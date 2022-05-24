require('dotenv').config()

var cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')

const app = express()
const port = process.env.PORT || 5000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.json())
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

let refreshTokens = []

const posts = [
    { email: 'Kyle@gmail.com', password: '123' },
    { email: 'Jim@gmail.com', password: '123' }
]

// app.post('/employee/login', (req, res) => {

//     pool.getConnection((err, connection) => {
//         if (err) throw err
//         const { email, password } = req.body

//         connection.query('SELECT * FROM employee WHERE email = ? AND password = ?', [email, password], (err, rows) => {
//             connection.release()    // return the connection to pool
//             if (!err) {
//                 res.send(rows)
//             } else {
//                 console.log(err)
//             }
//         })
//     })
// })

// app.post('/login', (req, res) => {
//     const email = req.body.email
//     const password = req.body.password
//     const user = { email: email, password: password }

//     const accessToken =  jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '25s' })
//     const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
//     refreshTokens.push(refreshToken)
//     res.json({ accessToken: accessToken , refreshToken: refreshToken})
// })

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
                    // refreshTokens.push(refreshToken)
                    // res.json({ accessToken: accessToken, refreshToken: refreshToken })
                    res.json({ accessToken: accessToken })
                }
            } else {
                console.log(err)
            }
        })
    })
})

app.get('/posts', authenticateToken, (req, res) => {
    res.send('login ok')
    // res.json(posts.filter(post => post.email === req.user.email))
})

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

app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
})

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

function generateAccessToken(user) {
    // return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '25s' })
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

// get all dog record
app.get('/dog', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('SELECT * FROM dog', (err, rows) => {
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
app.get('/dog/:id', (req, res) => {

    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`connected as id ${connection.threadId}`)

        connection.query('SELECT * FROM dog WHERE id = ?', [req.params.id], (err, rows) => {
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
app.delete('/dog/:id', (req, res) => {

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
app.post('/dog', (req, res) => {

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
app.put('/dog', (req, res) => {

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

// *********************************************************************************************************************************************************************

// // get all user record
// app.get('/user', (req, res)=> {

//     pool.getConnection((err, connection)=>{
//         if(err) throw err
//         console.log(`connected as id ${connection.threadId}`)

//         connection.query('SELECT * FROM user', (err, rows)=>{
//             connection.release()    // return the connection to pool

//             if(!err) {
//                 res.send(rows)
//             } else {
//                 console.log(err)
//             }
//         })
//     })
// })

// // get a user record by id
// app.get('/user/:id', (req, res)=> {

//     pool.getConnection((err, connection)=>{
//         if(err) throw err
//         console.log(`connected as id ${connection.threadId}`)

//         connection.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, rows)=>{
//             connection.release()    // return the connection to pool

//             if(!err) {
//                 res.send(rows)
//             } else {
//                 console.log(err)
//             }
//         })
//     })
// })

// // delete a user record by id
// app.delete('/user/:id', (req, res)=> {

//     pool.getConnection((err, connection)=>{
//         if(err) throw err
//         console.log(`connected as id ${connection.threadId}`)

//         connection.query('DELETE FROM user WHERE id = ?', [req.params.id], (err, rows)=>{
//             connection.release()    // return the connection to pool

//             if(!err) {
//                 res.send(`user with the record id:${[req.params.id]} has been removed.`)
//             } else {
//                 console.log(err)
//             }
//         })
//     })
// })

// // insert a user record
// app.post('/user', (req, res)=> {

//     pool.getConnection((err, connection)=>{
//         if(err) throw err
//         console.log(`connected as id ${connection.threadId}`)

//         const params = req.body

//         connection.query('INSERT INTO user SET ?', params, (err, rows)=>{
//             connection.release()    // return the connection to pool

//             if(!err) {
//                 res.send(`user with the record name:${[params.name]} has been added.`)
//             } else {
//                 console.log(err)
//             }
//         })

//         console.log(req.body)
//     })
// })

// // update a user record
// app.put('/user', (req, res)=> {

//     pool.getConnection((err, connection)=>{
//         if(err) throw err
//         console.log(`connected as id ${connection.threadId}`)

//         const { id, name, age, sex, image, employee_id } = req.body

//         connection.query('UPDATE user SET name = ?, age = ?, sex = ?, image = ?, employee_id = ? WHERE id = ?', [name, age, sex, image, employee_id, id], (err, rows)=>{
//             connection.release()    // return the connection to pool

//             if(!err) {
//                 res.send(`user with the record name:${[name]} has been updated.`)
//             } else {
//                 console.log(err)
//             }
//         })

//         console.log(req.body)
//     })
// })

// listen on env port or 5000
app.listen(port, () => console.log(`listen on port ${port}`))