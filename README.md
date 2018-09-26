# mongoose-repository
A mongoose Repository based

### install
```
npm install @spksoft/mongoose-repository
```

### Usage
user.repository.js file
```javascript
import UserModel from './user.model'
import MongooseBaseRepository from '@spksoft/mongoose-repository'

class UserRepository extends MongooseBaseRepository {

}

const instance = new UserRepository(UserModel)
export default instance
```

user.model.js file
```javascript
import Mongoose from 'mongoose'
import MongoosePaginate from 'mongoose-paginate'
import timestamps from 'mongoose-timestamp'

export const schemaDefinition = {
  username: { type: String, required: true, unique: true },
  password: { type: String }
}

var Schema = new Mongoose.Schema(schemaDefinition)
Schema.plugin(timestamps)
Schema.plugin(MongoosePaginate)

const Model = Mongoose.model('User', Schema)
export default Model

```

### Example
find
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
  return VehicleRepository.find(filter, options)
}
```