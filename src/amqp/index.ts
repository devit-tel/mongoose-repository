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
    delete config.service
    delete config.exchange
    delete config.vhosts
    configHost = { ...config }
  }
  let configRascal = {
    vhosts: {
      [`${env}`]: {
        ...configHost,
        exchanges: [""],
        queues: {},
        publications: {
          "default_exchange": {
            'exchange': [""],
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

export function amqpPublish(query: string, result: any, model: any) {
  try {
    Broker.publish('default_exchange', result, `${env}.${routingKey}.${query}.${model}`, (err: any, publication: any) => {
      console.log(`Publish to ${env}.${routingKey}.${query}.${model}`)
      if (err) console.error('AMQP can not publish')
      publication.on('success', (messageId: any) => {
        console.log('success and messageId is', messageId)
      })
    })
  } catch (error) {
  }
  return
}
