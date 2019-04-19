import Rascal from 'rascal'

declare var process : {
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
const queueNameCreate = `${process.env.NODE_ENV}.${routingKey}.CREATE`
const queueNameUpdate = `${process.env.NODE_ENV}.${routingKey}.UPDATE`
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
        `${exchangeName}[${routingKey}.CREATE] -> ${queueNameCreate}`,
        `${exchangeName}[${routingKey}.UPDATE] -> ${queueNameUpdate}`,
      ],
      publications: {
        [`${routingKey}.CREATE`]: {
          'exchange': [exchangeName],
          'routingKey': `${routingKey}.CREATE`
        },
        [`${routingKey}.UPDATE`]: {
          'exchange': [exchangeName],
          'routingKey': `${routingKey}.UPDATE`
        }
      }
    }
  }
}

export let Broker: any
export async function init() {
  Rascal.Broker.create(Rascal.withDefaultConfig(configRascal), (err: any, broker: any) => {
    if (err) {
      console.log(err)
      // throw err
    }
    console.log('###### connect AMQP success ######')
    Broker = broker
  })
}
