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
  timestamp: { type: Number },
  count: { type: Number },
  logs: { type: Array }
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
app.post('/api/users/:_id/exercises', async (req, res) => {
  let id = req.params._id // get请求url的参数在query、post请求url的参数在params、post请求的表单提交数据在body
  let obj = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString(),
    timestamp: req.body.date
      ? new Date(req.body.date).getTime()
      : new Date().getTime()
  }
  Person.findById(id, (err, data) => {
    if (err) return console.log(err)
    if (data.count === undefined) {
      data.logs = []
      data.logs.push(obj)
      data.count = 1
      data.save((err, dt) => {
        if (err) return console.log(err)
        res.json({
          _id: dt._id.toString(),
          username: dt.username,
          date: obj.date,
          duration: obj.duration,
          description: obj.description
        })
      })
    } else {
      data.logs.push(obj)
      data.count++
      data.save((err, dt) => {
        if (err) return console.log(err)
        obj._id = dt._id.toString()
        res.json({
          _id: dt._id.toString(),
          username: dt.username,
          date: obj.date,
          duration: obj.duration,
          description: obj.description
        })
      })
    }
  })
})

// 获取用户exercise日志
app.get('/api/users/:_id/logs', (req, resp) => {
  let id = req.params._id
  console.log(id)
  // 查用户logs
  if (req.query.from === undefined) {
    // url没参数
    Person.findById(id).exec((err, res) => {
      if (err) return console.log(err)
      resp.json({
        _id: res._id.toString(),
        username: res.username,
        count: res.count,
        log: res.logs
      })
    })
  } else {
    // url有参数
    let from = req.query.from
    let to = req.query.to
    Person.findById(id).exec((err, res) => {
      if (err) return console.log(err)
      let log = []
      for (let i in res.logs) {
        if (
          new Date(from).getTime() < parseInt(res.logs[i].timestamp) &&
          new Date(to).getTime() > parseInt(res.logs[i].timestamp)
        ) {
          Reflect.deleteProperty(res.logs[i], 'timestamp')
          log.push(res.logs[i])
        }
      }
      resp.json({
        _id: res._id.toString(),
        username: res.username,
        from: new Date(from).toDateString(),
        to: new Date(to).toDateString(),
        count: log.length,
        log: log
      })
    })
  }
})
