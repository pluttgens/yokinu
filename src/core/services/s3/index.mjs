import AWS from 'aws-sdk';
import BaseService from '../BaseService';
import Promise from 'bluebird';
import { operationalLogger } from '../../loggers';

AWS.config.setPromisesDependency(Promise);

export default class S3Service extends BaseService {
  constructor(serviceConfig) {
    super('s3', serviceConfig);
    this.s3 = new AWS.S3({
      accessKeyId: this.config.accessKey,
      secretAccessKey: this.config.secret,
      region: this.config.region
    });
  }

  async _putTrack(input, track, transaction) {
    const s3Key = await track.getFsPath({
      includeTitle: true,
      join: true,
      transaction
    });

    try {
      const object = await this.s3
        .headObject({
          Bucket: this.config.bucket,
          Key: s3Key
        })
        .promise();
    } catch (err) {
      operationalLogger.debug(err);
    }

    await this.s3
      .putObject({
        Body: this._createReadStream(input),
        Bucket: this.config.bucket,
        Key: s3Key,
        Tagging: 'project=yokinu'
      })
      .promise();

    track.path = s3Key;
    return track;
  }
};
