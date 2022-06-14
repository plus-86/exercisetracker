const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
// database
const mySecret = process.env['MONGO_URI']
const mongoose = require('mongoose')
// connect database
mongoose.connect(mySecret, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
// create a model
const Schema = mongoose.Schema
const personSchema = new Schema({
  username: { type: String, required: true },
  id: { type: Object }, // id的type是Object
  description: { type: String },
  duration: { type: String },
  date: { type: String },
  timestamp: { type: Number }
})
const Person = mongoose.model('Person', personSchema)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// body-parser for post request
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// 创建用户
app.post('/api/users', (req, res) => {
  console.log(req.body)
  let p = new Person({
    username: req.body.username
  })
  p.save((err, data) => {
    if (err) return console.log(err)
    res.json({
      _id: data._id,
      username: data.username
    })
  })
})

// 请求所有用户
app.get('/api/users', (req, res) => {
  Person.find()
    .select({ __v: 0 }) // __v字段隐藏
    .exec((err, data) => {
      if (err) return console.log(err)
      res.send(data)
    })
})
// 写入description、duration 和 date
app.post('/api/users/:_id/exercises', (req, res) => {
  let id = req.body[':_id']
  console.log(id, typeof id)
  console.log(req.body.date, 'req.body.date')
  Person.findByIdAndUpdate(
    id, // id是object模板里的type改成object才能提交
    {
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString(),
      timestamp: req.body.date
        ? new Date(req.body.date).getTime()
        : new Date().getTime()
    },
    { new: true }
  )
    .select({ username: 1, description: 1, duration: 1, date: 1, _id: 1 })
    .exec((err, data) => {
      if (err) return console.log(err)
      res.json(data)
    })
})

// 获取用户exercise日志
app.get('/api/users/:_id/logs', (req, res) => {
  let id = req.params._id
  // 传query范围查询其他用户
  if (req.query.limit !== undefined) {
    let from = new Date(req.query.from).getTime()
    let to = new Date(req.query.to).getTime()
    let limit = req.query.limit
    console.log(id, 'id', typeof id)
    console.log(from, 'from')
    console.log(to, 'to')
    console.log(limit, 'limit')
    Person.findById(id)
      .where('timestamp')
      .gte(from)
      .lte(to)
      .limit(limit)
      .exec((err, data) => {
        console.log(data, 'data')
        if (err) return console.log(err)
        res.send(data)
      })
  } else {
    // 不传参查自己
    Person.findById(id).exec((err, data) => {
      if (err) return console.log(err)
      res.json({
        _id: data._id,
        username: data.username,
        log: [
          {
            description: data.description,
            duration: parseInt(data.duration),
            date: data.date
          }
        ]
      })
    })
  }
})
