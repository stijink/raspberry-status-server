#!/usr/bin/env bash

docker-compose build
docker-compose run raspberry-status-server yarn install