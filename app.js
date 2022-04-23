const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')

const app = express()
const port = process.env.PORT || 5000

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

// mysql
const pool = mysql.createPool({
    connectionLimit: 10,
    host           : 'localhost',
    user           : 'root',
    password       : '',
    database       : 'vt6003cem_webapi',
})

// get all dog record
app.get('', (req, res)=> {
    
    pool.getConnection((err, connection)=>{
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        connection.query('SELECT * FROM dog', (err, rows)=>{
            connection.release()    // return the connection to pool

            if(!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

// get a dog record by id
app.get('/:id', (req, res)=> {
    
    pool.getConnection((err, connection)=>{
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        connection.query('SELECT * FROM dog WHERE id = ?', [req.params.id], (err, rows)=>{
            connection.release()    // return the connection to pool

            if(!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    })
})

// delete a dog record by id
app.delete('/:id', (req, res)=> {
    
    pool.getConnection((err, connection)=>{
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        connection.query('DELETE FROM dog WHERE id = ?', [req.params.id], (err, rows)=>{
            connection.release()    // return the connection to pool

            if(!err) {
                res.send(`dog with the record id:${[req.params.id]} has been removed.`)
            } else {
                console.log(err)
            }
        })
    })
})

// insert a dog record
app.post('', (req, res)=> {
    
    pool.getConnection((err, connection)=>{
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        const params = req.body

        connection.query('INSERT INTO dog SET ?', params, (err, rows)=>{
            connection.release()    // return the connection to pool

            if(!err) {
                res.send(`dog with the record name:${[params.name]} has been added.`)
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

// update a dog record
app.put('', (req, res)=> {
    
    pool.getConnection((err, connection)=>{
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`)
        
        const { id, name, age, sex, image } = req.body

        connection.query('UPDATE dog SET name = ?, age = ?, sex = ?, image = ? WHERE id = ?', [name, age, sex, image, id], (err, rows)=>{
            connection.release()    // return the connection to pool

            if(!err) {
                res.send(`dog with the record name:${[name]} has been updated.`)
            } else {
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

// listen on env port or 5000
app.listen(port, ()=> console.log(`listen on port ${port}`))