# mongoose-repository
A mongoose Repository based

### install
```
npm install @spksoft/mongoose-repository
```

### Usgae
user.repository.js file
```
import UserModel from './user.model'
import { MongooseBaseRepository } from '../../libraries/database/repositories/index'

class UserRepository extends MongooseBaseRepository {

}

const instance = new UserRepository(UserModel)
export default instance
```

user.model.js file
```
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