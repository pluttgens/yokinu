import config from 'config';
import Elasticsearch from 'elasticsearch';
import {elasticsearchLogger} from '../loggers';
import { env } from '../helpers';
import {exitCodes} from '../errors';

export const elasticsearch = new Elasticsearch.Client({
  host: config.yokinu.elasticsearch.host,
  deadTimeout: 30000,
  maxRetries: 5,
  log: function (config) {
    this.error = elasticsearchLogger.error.bind(elasticsearchLogger);
    this.warning = elasticsearchLogger.warn.bind(elasticsearchLogger);
    this.info = elasticsearchLogger.info.bind(elasticsearchLogger);
    this.debug = elasticsearchLogger.debug.bind(elasticsearchLogger);
    this.trace = (method, requestUrl, body, responseBody, responseStatus) => {
      elasticsearchLogger.debug({
        method,
        requestUrl,
        body,
        responseBody,
        responseStatus
      })
    };
    this.close = function() {};
  }
});
export async function init() {
  if (env.shouldForceSync()) {
    try {
      elasticsearchLogger.info('attempting to join the cluster...');
      await elasticsearch.ping({
        requestTimeout: 30000
      });
    } catch (e) {
    }
    await elasticsearch.indices.delete({
      index: '*'
    });
    return elasticsearch.indices.create({
      index: config.yokinu.elasticsearch.index
    });
  }
}
