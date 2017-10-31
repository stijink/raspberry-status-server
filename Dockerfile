FROM node:8

# Configure yarn
ENV YARN_CACHE='/var/cache/yarn'
ENV PATH=/root/.yarn/bin:$PATH

# Install yarn
RUN curl -o- -L https://yarnpkg.com/install.sh | bash

# Install nodemon
RUN yarn global add nodemon

EXPOSE 9360
