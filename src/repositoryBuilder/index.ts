import * as mongoose from 'mongoose'
import MongooseBaseRepository from '../baseRepository/index'
import * as mongoosePaginate from 'mongoose-paginate'
import * as mongooseTimestamps from 'mongoose-timestamp'
import * as mongooseDelete from 'mongoose-delete'
import * as mongooseAggregatePaginate from 'mongoose-aggregate-paginate'
import { init } from '../amqp'

declare var process: {
  env: {
    ENABLE_AMQP: boolean
  }
}

process.env.ENABLE_AMQP ? init() : null

interface SchemaPlugin {
  plugin: any,
  options: any
}

interface SchemaIndexs {
  fields: {
    [key: string] : number
  },
  options: any
}

interface SchemaConfig {
  plugins?: [SchemaPlugin]
  indexs?: [SchemaIndexs]
} // You can create more interface like set, pre, N/A here

export default (modelName: string, schemaDefinition: any, schemaConfig: SchemaConfig = {}) => {
  const Schema = new mongoose.Schema(schemaDefinition)
  Schema.plugin(mongooseDelete, { deletedAt: true, indexFields: true, overrideMethods: true })
  Schema.plugin(mongooseTimestamps)
  Schema.plugin(mongoosePaginate)
  Schema.plugin(mongooseAggregatePaginate)
  if(Array.isArray(schemaConfig.plugins)) {
    schemaConfig.plugins.map(({ plugin, options }) => Schema.plugin(plugin, options))
  }
  if(Array.isArray(schemaConfig.indexs)) {
    schemaConfig.indexs.map(({ fields, options }) => Schema.index(fields, options))
  }

  const Model = mongoose.model(modelName, Schema)
  const Repository = new MongooseBaseRepository(Model)

  return {
    default: Repository,
    Repository,
    Model,
    Schema,
    SchemaDefinition: schemaDefinition,
    Mongoose: mongoose,
  }
}
