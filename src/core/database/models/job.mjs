import Sequelize from 'sequelize';
import sqlGlobals from './utils/sequelize-globals';
import { redis } from '../redis';
import { redisLogger } from '../../loggers/index';

const JOB_STATUS = {
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  SUCCEEDED: 'SUCCEEDED'
};

export default function (sequelize) {
  const Job = sequelize.define('job', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    status: {
      type: Sequelize.ENUM(JOB_STATUS.FAILED, JOB_STATUS.SUCCEEDED),
      required: true,
    }
  }, {
    ...sqlGlobals.defaultOptions,
    hooks: {
      afterCreate(job, options) {
        return this.deleteProgress(job.id);
      }
    }
  });

  Job.associate = function (models) {
    this.belongsTo(models.user, { as: 'user' });
  };

  Job.STATUS = JOB_STATUS;

  Job.cacheProgress = async function (jobId, progress) {
    try {
      return redis.setAsync(jobId, Math.floor(progress));
    } catch (err) {
      redisLogger.error(err);
      throw err;
    }
  };

  Job.getProgress = async function (jobId) {
    try {
      return redis.getAsync(jobId);
    } catch (err) {
      redisLogger.error(err);
      throw err;
    }
  };

  Job.deleteProgress = async function (jobId) {
    try {
      return redis.delAsync(jobId);
    } catch (err) {
      redisLogger.error(err);
      throw err;
    }
  };

  Job.searchById = async function (jobId) {
    const progress = await this.getProgress(jobId);
    if (progress) {
      return {
        id: jobId,
        status: this.STATUS.PENDING,
        progress
      };
    }
    return this.findById(jobId);
  };

  Job.KINDS = {
    COPY: 'copy'
  };

  Job.getKinds = function () {
    return Object.values(Job.KINDS);
  };

  return Job;
}

