import * as Rascal from 'rascal'

declare var process: {
  env: {
    NODE_ENV: string,
    MONGOOSE_AMQP_URI: string,
    MONGOOSE_AMQP_USERNAME: string,
    MONGOOSE_AMQP_PASSWORD: string,
    MONGOOSE_AMQP_PORT: number,
    MONGOOSE_AMQP_SERVICE: string,
    MONGOOSE_ENABLE_AMQP: string,
    MONGOOSE_AMQP_EXCHANGE: string,
    MONGOOSE_AMQP_MODEL: string,
    MONGOOSE_AMQP_TTL: number,
  }
}

let queues: any = {}
let publications: any = {}
let bindings: any = []
let ttl = process.env.MONGOOSE_AMQP_TTL
let env = process.env.NODE_ENV
let service = process.env.MONGOOSE_AMQP_SERVICE
let isProduction = env === 'production'
let amqpUrl = process.env.MONGOOSE_AMQP_URI ? process.env.MONGOOSE_AMQP_URI.split(',') : null
let mongooseModel = process.env.MONGOOSE_AMQP_MODEL ? process.env.MONGOOSE_AMQP_MODEL.split(',') : null
let exchangeName = process.env.MONGOOSE_AMQP_EXCHANGE
let isInit = false

const generateConfig = () => {
  if (mongooseModel && mongooseModel.length > 0) {
    mongooseModel.map((model: any) => {
      queues[`${env}.${service}.create.${model}`] = {
        options: {
          durable: true,
          arguments: {
            'x-message-ttl': +ttl,
            'x-dead-letter-exchange': `${exchangeName}.create.expired`,
            'x-dead-letter-routing-key': 'request_create_is_expired',
          }
        }
      }
      queues[`${env}.${service}.update.${model}`] = {
        options: {
          durable: true,
          arguments: {
            'x-message-ttl': +ttl,
            'x-dead-letter-exchange': `${exchangeName}.update.expired`,
            'x-dead-letter-routing-key': 'request_update_is_expired',
          }
        }
      }
      queues[`${env}.${service}.create.${model}.expired`] = {
        options: { durable: true }
      },
      queues[`${env}.${service}.update.${model}.expired`] = {
        options: { durable: true }
      }
      publications[`${service}.create.${model}`] = {
        exchange: [exchangeName],
        routingKey: `${service}.create.${model}`
      }
      publications[`${service}.update.${model}`] = {
        exchange: [exchangeName],
        routingKey: `${service}.update.${model}`
      }
      publications[`request_create_is_expired`] = {
        exchange: [`${exchangeName}.create.expired`],
        routingKey: 'request_create_is_expired'
      }
      publications[`request_update_is_expired`] = {
        exchange: [`${exchangeName}.update.expired`],
        routingKey: 'request_update_is_expired'
      }
      bindings.push(`${exchangeName}[${service}.create.${model}] -> ${`${env}.${service}.create.${model}`}`)
      bindings.push(`${exchangeName}[${service}.update.${model}] -> ${`${env}.${service}.update.${model}`}`)
      bindings.push(`${exchangeName}.create.expired[request_create_is_expired] -> ${`${env}.${service}.create.${model}.expired`}`)
      bindings.push(`${exchangeName}.update.expired[request_update_is_expired] -> ${`${env}.${service}.update.${model}.expired`}`)
    })
  }
}

let configHost = {}
if (isProduction) {
  configHost = {
    connections: amqpUrl
  }
} else {
  configHost = {
    connection: {
      slashes: true,
      protocol: 'amqp',
      hostname: amqpUrl ? amqpUrl[0] : null,
      user: process.env.MONGOOSE_AMQP_USERNAME,
      password: process.env.MONGOOSE_AMQP_PASSWORD,
      vhost: `//${env}`,
      port: process.env.MONGOOSE_AMQP_PORT,
      options: {
        heartbeat: 5
      },
      socketOptions: {
        timeout: 1000
      }
    }
  }
}

export let Broker: any
export async function init(config: any) {
  if (config) {
    isInit = true
    env = config.vhosts
    service = config.service
    mongooseModel = config.models
    ttl = config.ttl
    exchangeName = config.exchange
    delete config.ttl
    delete config.models
    delete config.service
    delete config.exchange
    delete config.vhosts
    configHost = { ...config }
  }
  generateConfig()
  let configRascal = {
    vhosts: {
      [`${env}`]: {
        ...configHost,
        exchanges: [exchangeName, `${exchangeName}.create.expired`, `${exchangeName}.update.expired`],
        queues,
        bindings,
        publications
      }
    }
  }

  Rascal.Broker.create(Rascal.withDefaultConfig(configRascal), (err: any, broker: any) => {
    if (err) {
      console.error('###### connect AMQP failed ######')
    } else {
      console.log('###### connect AMQP success ######')
    }
    Broker = broker
  })
}

export function amqpPublish(query: string, result: any, model: any) {
  if ((process.env.MONGOOSE_ENABLE_AMQP && process.env.MONGOOSE_ENABLE_AMQP === 'true') || isInit) {
    try {
      const key = `${service}.${query}.${model}`.toLocaleLowerCase()
      Broker.publish(key, result, (err: any, publication: any) => {
        console.log(`Publish to ${env}.${service}.${query}.${model}`)
        if (err) {
          console.error('AMQP can not publish')
          return
        }
        publication.on('success', (messageId: any) => {
          console.log('success and messageId is', messageId)
        })
      })
    } catch (error) {
    }
  }
  return
}
