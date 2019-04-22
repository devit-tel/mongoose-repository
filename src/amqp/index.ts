import * as Rascal from 'rascal'

declare var process: {
  env: {
    NODE_ENV: string,
    AMQP_URI: string,
    AMQP_URI1: string,
    AMQP_URI2: string,
    AMQP_URI3: string,
    AMQP_USERNAME: string,
    AMQP_PASSWORD: string,
    AMQP_PORT: number,
    AMQP_SERVICE: string,
  }
}

const routingKey = process.env.AMQP_SERVICE
const queueNameCreate = `${process.env.NODE_ENV}.${routingKey}.create`
const queueNameUpdate = `${process.env.NODE_ENV}.${routingKey}.update`
const exchangeName = `${process.env.NODE_ENV}.mongoose-repository.caller`
const isProduction = process.env.NODE_ENV === 'production'

let configHost = {}
if (isProduction) {
  configHost = {
    connections: [
      `amqp://${process.env.AMQP_USERNAME}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_URI1}:${process.env.AMQP_PORT}//${process.env.NODE_ENV}?heartbeat=5`,
      `amqp://${process.env.AMQP_USERNAME}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_URI2}:${process.env.AMQP_PORT}//${process.env.NODE_ENV}?heartbeat=5`,
      `amqp://${process.env.AMQP_USERNAME}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_URI3}:${process.env.AMQP_PORT}//${process.env.NODE_ENV}?heartbeat=5`
    ]
  }
} else {
  configHost = {
    connection: {
      slashes: true,
      protocol: 'amqp',
      hostname: process.env.AMQP_URI,
      user: process.env.AMQP_USERNAME,
      password: process.env.AMQP_PASSWORD,
      vhost: `//${process.env.NODE_ENV}`,
      port: process.env.AMQP_PORT,
      options: {
        heartbeat: 5
      },
      socketOptions: {
        timeout: 1000
      }
    }
  }
}
const configRascal = {
  vhosts: {
    [`${process.env.NODE_ENV}`]: {
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

export let Broker: any
export async function init() {
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
    Broker.publish(`${process.env.AMQP_SERVICE}.${query}`, result, (err: any, publication: any) => {
      if (err) console.error('AMQP can not publish')
      publication.on('success', (messageId: any) => {
        console.log('success and messageId is', messageId)
      })
    })
  } catch (error) {
    console.error('AMQP can not publish')
  }
  return
}