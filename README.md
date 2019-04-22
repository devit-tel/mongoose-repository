# mongoose-repository
A mongoose Repository based
Include Plugin:
- mongoose
- mongoose-delete (default options: { deletedAt: true, indexFields: true, overrideMethods: true })
- mongoose-history
- mongoose-paginate
- mongoose-timestamp
- mongoose-aggregate-paginate

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

add these variable in .env
```javascript
NODE_ENV
MONGOOSE_ENABLE_AMQP //true of false
MONGOOSE_AMQP_URI
MONGOOSE_AMQP_USERNAME
MONGOOSE_AMQP_PASSWORD
MONGOOSE_AMQP_PORT
MONGOOSE_AMQP_SERVICE //amqp service name
```

Example For cluster connections
```
MONGOOSE_AMQP_URI=amqp://guest:guest@example1.com:5672/v1?heartbeat=10,
amqp://guest:guest@example2.com:5672/v1?heartbeat=10,
amqp://guest:guest@example3.com:5672/v1?heartbeat=10
```

pattern queue name
```
NODE_ENV.MONGOOSE_AMQP_SERVICE.model.create
NODE_ENV.MONGOOSE_AMQP_SERVICE.model.update
```

example
```
staging.fleet.vehicles.create
```

or

```javascript
import { init } from 'sendit-mongoose-repository'

init({
  service: 'myservice',
  exchange: `exchange-service-caller`,
  queueNameCreate: `${process.env.NODE_ENV}.${process.env.MONGOOSE_AMQP_SERVICE}.model.create`,
  queueNameUpdate: `${process.env.NODE_ENV}.${process.env.MONGOOSE_AMQP_SERVICE}.model.update`,
  vhosts: process.env.NODE_ENV,
  connection: {
    slashes: true,
    protocol: 'amqp',
    hostname: process.env.MONGOOSE_AMQP_URI,
    user: process.env.MONGOOSE_AMQP_USERNAME,
    password: process.env.MONGOOSE_AMQP_PASSWORD,
    vhost: `//${process.env.NODE_ENV}`,
    port: process.env.MONGOOSE_AMQP_PORT,
    options: {
      heartbeat: 5,
    },
    socketOptions: {
      timeout: 1000,
    },
  },
})
```