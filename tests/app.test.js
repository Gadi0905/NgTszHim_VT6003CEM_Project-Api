const app = require('../app')
const req = require('supertest')

// when user give token => ok
describe('Post Endpoints', () => {
    it('should create a new post', async () => {
        const token = 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTM3MjkwMjJ9.-4MZBYaiVYZIrva-cin0BpwNGCZewylM1nPBrEPeA-M'
        const res = await req(app).post('/dog').send({
            name: "haha",
            age: '5',
            sex: 'F'
        }).set('Authorization', token) 
        expect(res.statusCode).toEqual(200)
    })
})

// when user did not give token => not ok
describe('Post Endpoints', () => {
    it('should create a new post', async () => {
        const token = 'Bearer ' + ''
        const res = await req(app).post('/dog').send({
            name: "haha",
            age: '5',
            sex: 'F'
        }).set('Authorization', token) 
        expect(res.statusCode).toEqual(200)
    })
})

// when database have dog
// when user give token => ok
describe('delete Endpoints', () => {
    it('should delete a dog', async () => {
        const token = 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTM3MjkwMjJ9.-4MZBYaiVYZIrva-cin0BpwNGCZewylM1nPBrEPeA-M'
        const res = await req(app).delete('/dog/10').set('Authorization', token) 
        expect(res.statusCode).toEqual(200)
    })
})

// when database have dog
// when user did not give token => not ok
describe('delete Endpoints', () => {
    it('should delete a dog', async () => {
        const token = 'Bearer ' + ''
        const res = await req(app).delete('/dog/11').set('Authorization', token) 
        expect(res.statusCode).toEqual(200)
    })
})