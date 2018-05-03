#!/usr/bin/env bash

while ! curl --silent --output /dev/null http://elasticsearch:9200; do sleep 1; done;

npm run dev
