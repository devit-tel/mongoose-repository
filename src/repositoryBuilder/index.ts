import * as mongoose from 'mongoose'
import MongooseBaseRepository from '../baseRepository/index'
import * as mongoosePaginate from 'mongoose-paginate'
import * as mongooseTimestamps from 'mongoose-timestamp'
import * as mongooseDelete from 'mongoose-delete'
import * as mongooseHistory from 'mongoose-history'

export default (modelName: string, schemaDefinition: any) => {
  const Schema = new mongoose.Schema(schemaDefinition)
  Schema.plugin(mongooseDelete, { deletedAt: true, indexFields: true, overrideMethods: true })
  Schema.plugin(mongooseTimestamps)
  Schema.plugin(mongoosePaginate)
  Schema.plugin(mongooseHistory, {customCollectionName: "history"})

  const Model = mongoose.model(modelName, Schema)
  const Repository = new MongooseBaseRepository(Model)

  return {
    default: Repository,
    Repository,
    Model,
    Schema,
    SchemaDefinition: schemaDefinition,
    Mongoose: mongoose
  }
}
