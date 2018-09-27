# mongoose-repository
A mongoose Repository based

### install
```
npm install @spksoft/mongoose-repository
```

### Usage
user.repository.js file
```javascript
import RepositoryBuilder from '@spksoft/mongoose-repository'

const schemaDefinition = {
  name: {
    type: String,
    require: true
  },
  foo: {
    type: [Number],
    require: true
  }
}

export default RepositoryBuilder('Bar', schemaDefinition)
//  {
//      Model,
//      Schema,
//      Repository,
//      schemaDefinition,
//      default: Repository
//  }
```

```javascript
import Bar from './Bar.js'

Bar.Repository.create({
    name: 'eiei',
    foo: [12, 69]
})
```

### Example
find with repository
```javascript
import UserRepository from './user.repository.js'

export default async function getUser() {
  var filter = {
    name: 'Yana'
  }
  var options = {
    limit: 10, // limit data 10 rows
    page: 1, // start 1
    sort: 'username -password', // sort by "username" ascending and "password" descending
    populate: 'userType'
  }
  return UserRepository.find(filter, options)
}
```

find with model
```javascript
import UserRepository from './user.repository.js'

export default async function getUser() {
  var filter = {
    name: 'Yana'
  }
  var options = {
    limit: 10, // limit data 10 rows
    page: 1, // start 1
    sort: 'username -password', // sort by "username" ascending and "password" descending
    populate: 'userType'
  }
  return UserRepository.Model.find(filter, options)
}
```

get schema definition
```javascript
import UserRepository from './user.repository.js'

export default async function getUserSchemaDefinition() {
  return UserRepository.schemaDefinition
}
```
