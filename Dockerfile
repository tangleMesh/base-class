FROM node:10.14.1-alpine

# Create app directory
WORKDIR /usr/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install --quiet
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]


#build
#docker build -t test-project/base-class .

#run
#docker run -p 3000:3000 -d test-project/base-class

# Get container ID
#$ docker ps

# Print app output
#$ docker logs <container id>

# Example
#Running on http://localhost:3000

# Enter the container
#$ docker exec -it <container id> /bin/bash<
