FROM cypress/included:12.17.4
# FROM cypress/included:13.7.3

WORKDIR /e2e

RUN apt-get -y update; apt-get -y install curl
COPY package.json /e2e
RUN npm install --legacy-peer-deps

COPY cypress.config.ts /e2e
COPY cypress-image-diff-html-report.config.js /e2e
COPY cypress-image-diff.config.js /e2e
COPY tsconfig.json /e2e
COPY *.yml /e2e
ADD cypress /e2e/cypress

ENTRYPOINT ["npm", "run"]
CMD ["cy:run:html"]