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
let exchangeName = `${env}.${process.env.MONGOOSE_AMQP_EXCHANGE}`
let isInit = false
let actions = ['update', 'create', 'delete']

const generateConfig = () => {
  if (mongooseModel && mongooseModel.length > 0) {
    mongooseModel.map((model: any) => {
      actions.map((action: any) => {
        queues[`${env}.${service}.${action}.${model}`] = {
          options: {
            durable: true,
            arguments: {
              'x-message-ttl': +ttl,
              'x-dead-letter-exchange': `${exchangeName}.${action}.expired`,
              'x-dead-letter-routing-key': `request_${action}_is_expired`,
            }
          }
        }
        queues[`${env}.${service}.${action}.${model}.expired`] = {
          options: { durable: true }
        }
        publications[`${service}.${action}.${model}`] = {
          exchange: [exchangeName],
          routingKey: `${service}.${action}.${model}`
        }
        publications[`request_${action}_is_expired`] = {
          exchange: [`${exchangeName}.${action}.expired`],
          routingKey: `request_${action}_is_expired`
        }
        bindings.push(`${exchangeName}[${service}.${action}.${model}] -> ${`${env}.${service}.${action}.${model}`}`)
        bindings.push(`${exchangeName}.${action}.expired[request_${action}_is_expired] -> ${`${env}.${service}.${action}.${model}.expired`}`)
      })
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
    exchangeName = `${env}.${config.exchange}`
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
        exchanges: [exchangeName, `${exchangeName}.create.expired`, `${exchangeName}.update.expired`, `${exchangeName}.delete.expired`],
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
