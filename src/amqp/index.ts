import * as Rascal from 'rascal'

declare var process: {
  env: {
    NODE_ENV: string,
    MONGOOSE_AMQP_URI: string,
    MONGOOSE_AMQP_USERNAME: string,
    MONGOOSE_AMQP_PASSWORD: string,
    MONGOOSE_AMQP_PORT: number,
    MONGOOSE_AMQP_SERVICE: string,
  }
}
let env = process.env.NODE_ENV
let routingKey = process.env.MONGOOSE_AMQP_SERVICE
let queueNameCreate = `${env}.${routingKey}.create`
let queueNameUpdate = `${env}.${routingKey}.update`
let exchangeName = `${env}.mongoose-repository.caller`
let isProduction = env === 'production'
let amqpUrl = process.env.MONGOOSE_AMQP_URI ? process.env.MONGOOSE_AMQP_URI.split(',') : null

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
    env = config.vhosts
    routingKey = config.service
    exchangeName = config.exchange
    queueNameCreate = config.queueNameCreate
    queueNameUpdate = config.queueNameUpdate
    delete config.service
    delete config.queueNameCreate
    delete config.exchange
    delete config.queueNameUpdate
    delete config.vhosts
    configHost = { ...config }
  }
  let configRascal = {
    vhosts: {
      [`${env}`]: {
        ...configHost,
        exchanges: [exchangeName],
        queues: {
          [queueNameCreate]: { options: { durable: true } },
          [queueNameUpdate]: { options: { durable: true } },
        },
        bindings: [
          `${exchangeName}[${routingKey}.create] -> ${queueNameCreate}`,
          `${exchangeName}[${routingKey}.update] -> ${queueNameUpdate}`,
        ],
        publications: {
          [`${routingKey}.create`]: {
            'exchange': [exchangeName],
            'routingKey': `${routingKey}.create`
          },
          [`${routingKey}.update`]: {
            'exchange': [exchangeName],
            'routingKey': `${routingKey}.update`
          }
        }
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

export function amqpPublish(query: string, result: any) {
  try {
    Broker.publish(`${routingKey}.${query}`, result, (err: any, publication: any) => {
      if (err) console.error('AMQP can not publish')
      publication.on('success', (messageId: any) => {
        console.log('success and messageId is', messageId)
      })
    })
  } catch (error) {
  }
  return
}