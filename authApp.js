require('dotenv').config()

const express = require('express')
var cors = require('cors')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')

const app = express()
const port = process.env.PORT || 6000

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())
app.use(express.json())

app.use(cors())

// mysql
const pool = mysql.createPool({
    connectionLimit: 10,
    host           : 'localhost',
    user           : 'root',
    password       : 'secret',
    database       : 'vt6003cem_webapi',
})

// *********************************************************************************************************************************************************************

let refreshTokens = [] 

app.post('/token', (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.sendStatus(401)
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = generateAccessToken({ name: user.name })
        res.json({ accessToken: accessToken })
    })
})

app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
})

app.post('/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const user = { email: email, password: password}

    const accessToken =  generateAccessToken(user)
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
    refreshTokens.push(refreshToken)
    res.json({ accessToken: accessToken , refreshToken: refreshToken})
})

function generateAccessToken(user) {
    return  jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' })
}

// *********************************************************************************************************************************************************************

app.listen(port, ()=> console.log(`listen on port ${port}`))