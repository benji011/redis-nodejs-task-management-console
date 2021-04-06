const express = require('express')
const expressHandleBars = require('express-handlebars')
const path = require('path')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const redis = require('redis')

// Server port
const PORT = 3000
const app = express()

// Redis client
let client = redis.createClient()
client.on('connect', () => {
  console.log('connected to Redis ...')
})

// Sets view engine
app.engine('handlebars', expressHandleBars({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
  })
)

// Method-override to perform delete in a form
app.use(methodOverride('_method'))

app.get('/', (req, res, next) => {
  client.keys('*task*', (err, obj) => {
    res.render('searchtasks', {
      tasks: obj,
    })
  })
})

// Search tasks
app.post('/tasks/search', (req, res, next) => {
  let id = req.body.id
  client.hgetall(id, (err, obj) => {
    if (!obj) {
      res.render('searchtasks', {
        error: `Task id not found`,
      })
    } else {
      obj.id = id
      res.render('details', {
        task: obj,
      })
    }
  })
})
// WIP - figure out how to get just 1 task details from Redis
app.get('/tasks/details/:id', (req, res, next) => {
  client.hget(req.params.id, ['title', 'description'], (err, obj) => {
    if (err) {
      console.log(err)
    }
    res.render('details', {
      task: obj,
    })
  })
})

app.get('/tasks/add', (req, res, next) => {
  res.render('addtasks')
})

// Add a task
app.post('/tasks/add', (req, res, next) => {
  let id = req.body.id
  let title = req.body.title
  let description = req.body.description

  client.hmset(
    id,
    ['title', title, 'description', description],
    (err, reply) => {
      if (err) {
        console.log(err)
      }
      res.redirect('/')
    }
  )
})

app.delete('/tasks/delete/:id', (req, res, next) => {
  let id = req.params.id
  client.del(id)
  res.redirect('/')
})

app.listen(PORT, () => {
  console.log(`listening on port:${PORT}`)
})
