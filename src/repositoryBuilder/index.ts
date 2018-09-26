import * as mongoose from 'mongoose'
import MongooseBaseRepository from '../index'
import * as mongoosePaginate from 'mongoose-paginate'
import * as mongooseTimestamps from 'mongoose-timestamp'
import * as mongooseDelete from 'mongoose-delete'

export default (modelName: string, schemaDefinition: any, collectionName: string) => {
  const Schema = new mongoose.Schema(schemaDefinition)
  Schema.plugin(mongooseDelete)
  Schema.plugin(mongooseTimestamps)
  Schema.plugin(mongoosePaginate)

  const Model = mongoose.model(modelName, Schema, collectionName)
  const Repository = new MongooseBaseRepository(Model)

  return {
    default: Repository,
    Repository,
    Model,
    Schema,
    schemaDefinition
  }
}
