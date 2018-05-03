import winston from 'winston';

const { format } = winston;
const { colorize, prettyPrint, printf, timestamp } = format;
const MESSAGE = Symbol.for('message');

export default [
  timestamp(),
  colorize(),
  prettyPrint(),
  printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
  }),
];
