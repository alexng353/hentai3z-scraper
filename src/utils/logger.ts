import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty'
  },
  customPrettifiers: {
    time: (timestamp : any) => `🕰 ${timestamp}`,
  },
});


export default logger;