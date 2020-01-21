# mongoose-repository
A mongoose Repository based
Include Plugin:
- mongoose
- mongoose-delete (default options: { deletedAt: true, indexFields: true, overrideMethods: true })
- mongoose-history
- mongoose-paginate
- ~~mongoose-timestamp~~  <b><span style="color:red">Deprecated version 1.1.10 change use mongoose provide timestamps</span></b>
- mongoose-aggregate-paginate
- rascal

### install
```
npm install sendit-mongoose-repository --save
```

## Create repo Example
bar.repository.js file
```javascript
import mongoose from 'mongoose'
import RepositoryBuilder from 'sendit-mongoose-repository'

const schemaDefinition = {
  name: {
    type: String,
    require: true
  },
  foos: {
    type: [Number],
    require: true
  },
  company: { type: Mongoose.Schema.Types.ObjectId, ref: 'Company' },
}

export const builder = RepositoryBuilder('Bar', schemaDefinition)
export default builder.Repository
// builder provides:
//  {
//      Model,
//      Schema,
//      Repository,
//      schemaDefinition
//  }
```

## BaseRepostory provides functions
```javascript
.findOne(query: any, options: any)
.find(query: any = {}, options: any = {})
.create(data: any)
.update(query: any, data: any)
.upsert(query: any, data: any)
  (default options: {upsert: true, new: true})
.delete(data: any)
.aggregate(data: any)
.aggregatePaginate(query: any, options)

```


## Usage Example
Find one
```javascript
import BarRepository from './bar.repository.js'
export default async function list() {
  var filter = {
    name: 'default'
  }
  var options = {
    populate: 'company' //optional
  }
  return BarRepository.findOne(filter, options)
}
```

Find all
```javascript
import BarRepository from './bar.repository.js'

export default async function list() {
  var filter = {
    name: 'default'
  }
  var options = {
    populate: 'company' //optional
  }
  return BarRepository.find(filter, options)
}
```
Find with Paginate (required options.limit and options.page)

```javascript
var filter = {
  name: 'default'
}
var options = {
  limit: 10, // required
  page: 1, // required, start 1
  sort: {name: -1}, // optional, default: {_id: 1}, (ex. sort descending name)
  populate: 'company', // optional
  select: '-_id -__v -password' // optional omit _id, __v, password
}
return BarRepository.find(filter, options)
```

Create
```javascript
await BarRepository.create({ name: 'default' })
```

Update
```javascript
await BarRepository.update({ name: 'default' }, { foos: [12, 69] })
```

Delete
```javascript
await BarRepository.delete({ name: 'default' })
```

Aggregate
```javascript
import BarRepository from './bar.repository.js'

export default async function list() {
  var filter = {
    name: 'default'
  }
  var options = {
    populate: 'company' //optional
  }
  return BarRepository.find(filter, options)
}
```

Aggregate Paginate

```javascript
var aggregateQuery = [
  { $match : { name: 'default' } },
  { $project: { foos: 1 } }
]
var options = {
  limit: 10, // required
  page: 1, // required, start 1
  sort: {name: -1}
}
return BarRepository.aggregatePaginate(filter, options)
```

## AMQP

Publish queue after create or update <br/>

Pattern queue name
```
node_env.serviceName.create.model
node_env.serviceName.update.model
```

example
```
local.fleet.create.vehicles
```

```javascript
import { init } from 'sendit-mongoose-repository'

init({
  exchange: 'exchange-name',
  models: ['model'],
  ttl: 50000000000000, //millisecond
  service: 'serviceName',
  vhosts: 'local',
  connection: {
    slashes: true,
    protocol: 'amqp',
    hostname: '127.0.0.1',
    user: 'guest',
    password: 'guest',
    vhost: `//local`,
    port: 5672,
    options: {
      heartbeat: 5,
    },
    socketOptions: {
      timeout: 1000,
    },
  },
})
```

Example For cluster connections

```javascript
connections: [
        "amqp://guest:guest@example1.com:5672/v1?heartbeat=10",
        "amqp://guest:guest@example2.com:5672/v1?heartbeat=10",
        "amqp://guest:guest@example3.com:5672/v1?heartbeat=10"
      ]
```