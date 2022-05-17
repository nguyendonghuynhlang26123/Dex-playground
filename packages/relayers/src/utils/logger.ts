import { createLogger, Logger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import TelegramLogger from 'winston-telegram';

const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

var transport = new DailyRotateFile({
  filename: `${process.env.LOGGER_FILE ?? 'logs/'}-%DATE%.log`,
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d',
});

export const log: Logger = createLogger({
  // levels: myCustomLevels.levels,
  level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug',
  // defaultMeta: { service: 'user-service' },
  format: combine(timestamp(), myFormat),
  transports: [
    transport,
    new transports.Console({
      format: format.combine(format.colorize(), myFormat),
      // level: 'verbose',
    }),
    new TelegramLogger({
      name: 'relayer_log_bot',
      token: '5346056870:AAEHbH5IeBMx3B8z0bYdvCMryFydSWVhlPY',
      chatId: -760703970,
      level: 'http',
      unique: true,
      disableNotification: true,
    }),
  ],
});
