const mongoose = require('mongoose')
const MongooseBaseRepository = require('../index')
const mongoosePaginate = require('mongoose-paginate')
const mongooseTimestamps = require('mongoose-timestamp')
const mongooseDelete = require('mongoose-delete')

export default (modelName: String, schemaDefinition: any, collectionName: any) => {
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
