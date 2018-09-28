import mongoose from 'mongoose'
import MongooseBaseRepository from '../baseRepository/index'
import mongoosePaginate from 'mongoose-paginate'
import mongooseTimestamps from 'mongoose-timestamp'
import mongooseDelete from 'mongoose-delete'

export default (modelName: string, schemaDefinition: any) => {
  const Schema = new mongoose.Schema(schemaDefinition)
  Schema.plugin(mongooseDelete, { deletedAt: true, indexFields: true, overrideMethods: true })
  Schema.plugin(mongooseTimestamps)
  Schema.plugin(mongoosePaginate)

  const Model = mongoose.model(modelName, Schema)
  const Repository = new MongooseBaseRepository(Model)

  return {
    default: Repository,
    Repository,
    Model,
    Schema,
    schemaDefinition
  }
}
