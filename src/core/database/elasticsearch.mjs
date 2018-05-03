import config from 'config';
import Elasticsearch from 'elasticsearch';
import { elasticLogger } from '../loggers/index.mjs';
import { env } from '../helpers/index.mjs';
import { EXIT_CODES } from '../errors/index.mjs';

export const elasticsearch = new Elasticsearch.Client({
  host: config.yokinu.elasticsearch.host,
  pingTimeout: 30000,
  maxRetries: 5,
  log: function (config) {
    this.error = elasticLogger.error.bind(elasticLogger);
    this.warning = elasticLogger.warn.bind(elasticLogger);
    this.info = elasticLogger.info.bind(elasticLogger);
    this.debug = elasticLogger.debug.bind(elasticLogger);
    this.trace = (method, requestUrl, body, responseBody, responseStatus) => {
      elasticLogger.debug({
        method,
        requestUrl,
        body,
        responseBody,
        responseStatus
      })
    };
    this.close = function () {
    };
  }
});

export async function init() {
  if (env.shouldForceSync()) {
    try {

      await elasticsearch.indices.delete({
        index: '*'
      });
      return elasticsearch.indices.create({
        index: config.yokinu.elasticsearch.index
      });
    } catch (e) {
      elasticLogger.error(e);
      process.exit(EXIT_CODES.ELASTICSEARCH_ERROR);
    }
  }
}

