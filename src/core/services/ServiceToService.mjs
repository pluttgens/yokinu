import config from 'config';
import Queue from 'bee-queue';
import serviceManager from './ServiceManager';
import db from '../database/index';
import { operationalLogger } from '../loggers/index.mjs';
import { NoServiceFoundError } from './errors/index';
import { snowflake } from '../helpers/index.mjs';

class ServiceToService {
  constructor() {
    this.trackQueue = new Queue(`S2S-tracks`, {
      redis: {
        host: config.yokinu.redis.host,
        port: config.yokinu.redis.port
      },
      removeOnSuccess: true
    });

    this.trackQueue.process(async job => {
      operationalLogger.info(`${this.trackQueue.name} - Job ${job.id} started.`);
      const from = serviceManager.get(job.data.from);
      const to = serviceManager.get(job.data.to);
      const track = job.data.track;
      const keepServiceTags = job.data.keepServiceTags;
      const unloaded = job.data.unloaded;

      console.log(keepServiceTags);

      const stream = from.name === 'local' ? track.path : await from.getStream(track);
      operationalLogger.debug(`${this.trackQueue.name} - Job ${job.id} - got stream for track ${track.unloaded ? track.path : track.id}`);
      return to.putTrack(stream, {
        mime: stream.contentType,
        size: track.size,
        tags: keepServiceTags ? track : {},
        trackId: !unloaded ? track.id : undefined,
        requestId: job.id
      });
    });

    this.trackQueue.on('job succeeded', (jobId, track) => {
      operationalLogger.info(`${this.trackQueue.name} - Job ${jobId} succeeded - Track ${track.id}.`);
    });

    this.trackQueue.on('job failed', (jobId, err) => {
      operationalLogger.error(`${this.trackQueue.name} - Job ${jobId} failed - ${err.stack}.`);
    });

    this.copyQueue = new Queue(`S2S-requests`, {
      redis: {
        host: config.yokinu.redis.host,
        port: config.yokinu.redis.port
      }
    });

    this.copyQueue.process(async job => {
      operationalLogger.info(`${this.copyQueue.name} - Job ${job.id} started.`);
      const from = serviceManager.get(job.data.from);
      const tracks = (await db.track
        .findAll({
          where: {
            serviceId: from.name
          }
        }))
        .map(track => {
          track.get({ plain: true });
          track.unloaded = false;
          return track;
        });


      if (job.data.addUnloadedTracks) {
        operationalLogger.info(`${this.copyQueue.name} - Job ${job.id} : Add unloaded tracks.`);
        tracks.push(
          ... (await from
            .getUnloadedTracks({
              withServiceTags: job.data.keepServiceTags,
              skip: job.data.skip,
              limit: job.data.limit
            }))
            .map(unloadedTrack => {
              unloadedTrack.unloaded = true;
              return unloadedTrack
            })
        );
      }

      let count = 0;
      for (let track of tracks) {
        const trackJob = await this.trackQueue
          .createJob({
            from: job.data.from,
            to: job.data.to,
            track,
            keepServiceTags: job.data.keepServiceTags,
            index: ++count,
            total: tracks.length
          })
          .setId(await snowflake.getId())
          .timeout(30000)
          .save();


        trackJob.on('succeeded', result => {
          const progress = trackJob.data.index * 100 / trackJob.data.total;
          operationalLogger.debug(`${this.trackQueue.name} - Job ${trackJob.id} reporting progress : ${progress}`);
          job.reportProgress(progress);
        });
      }

      return count;
    });
  }

  async copy(from, to, { keepServiceTags = false, addUnloadedTracks = false, skip = 0, limit = 1000 }) {
    if (!serviceManager.get(from)) {
      throw new NoServiceFoundError(from);
    }

    if (!serviceManager.get(to)) {
      throw new NoServiceFoundError(to);
    }

    const job = await this.copyQueue
      .createJob({ from, to, keepServiceTags, addUnloadedTracks, skip, limit })
      .setId(await snowflake.getId())
      .timeout(1000 * 60 * 60) // 1 hour
      .save();

    operationalLogger.info(`Created new copy Job ${job.id} : ${from.name} to ${to.name}`);
    operationalLogger.info(`Skip: ${skip} - Limit: ${limit}`);
    operationalLogger.info(`Keep service tags: ${keepServiceTags}`);
    operationalLogger.info(`Add unloaded tracks: ${addUnloadedTracks}`);

    job.on('progress', progress => {
      operationalLogger.trace(`${this.copyQueue.name} - Job ${job.id} progress : ${progress}%.`);
      return db.job.cacheProgress(job.id, progress);
    });

    job.on('succeeded', count => {
      try {
        operationalLogger.info(`${this.copyQueue.name} - Job ${job.id} succeeded : copied ${count} tracks.`);
        return db.job.create({
          id: job.id,
          status: db.job.STATUS.SUCCEEDED
        })
      } catch (err) {
        operationalLogger.error(err);
      }
    });

    job.on('failed', async err => {
      try {
        operationalLogger.error(`${this.copyQueue.name} - Job ${job.id} failed : ${err.stack}.`);
        return db.job.create({
          id: job.id,
          status: db.job.STATUS.FAILED
        });
      } catch (err) {

      }
    });

    return job;
  }
}

const serviceToService = new ServiceToService();

export default serviceToService;
