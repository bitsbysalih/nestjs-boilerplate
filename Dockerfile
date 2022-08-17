###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:16-alpine As development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN npm ci

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN npm run build

# Set NODE_ENV environment variable
ENV NODE_ENV production
ENV PORT 8080
ENV MONGO_URI mongodb+srv://bitsbysalih:FreshStart1*@cluster0.brkx7.mongodb.net/ebc?retryWrites=true&w=majority
ENV JWT_SECRET Xx7GEJTabfUnUgkQzrzC
ENV SENDGRID_API_KEY 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
ENV AWS_S3_BUCKET ebc-markers-and-images
ENV AWS_S3_ACCESS_KEY AKIAROWZG5PWMD4MDHPE
ENV AWS_S3_KEY_SECRET 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
ENV CLOUDINARY_API_KEY 475625384624359
ENV CLOUDINARY_API_SECRET BjqtiQ10h5ieqF-NzNOmJ8ZDD7w
ENV CLOUDINARY_CLOUD_NAME salihudev
ENV BASE_URL https://api.sailspad.com
ENV STRIPE_PK pk_live_51Ja1YvByeePakSrH4G02ew70pXC659czcOFNFslN1QHHmFwLv0KvqSR5bOafvr5ZXSwONawRAELtqhBE5R4rWQiJ00tqEPfIx7
ENV STRIPE_SK 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
ENV STRIPE_CURRENCY usd
ENV STRIPE_WEBHOOK_SECRET whsec_R9ylFQanFa3SAbDjnRoEKzeTmpDtewj5
ENV FRONTEND_URL https://app.sailspad.com
ENV TWILIO_ACCOUNT_SID ACe42a1fe6b4401915b1b1a911538a98cb
ENV TWILIO_AUTH_TOKEN 3ed03633c05c8c49b71f0b1a7db9cf46
ENV MONTHLY_SUBSCRIPTION_PRICE_ID price_1L0UD1ByeePakSrHCJseGpSP
ENV YEARLY_SUBSCRIPTION_PRICE_ID price_1L0UCwByeePakSrH3SGI4BlG







# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:16-alpine As production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Start the server using the production build
CMD [ "node", "dist/main.js" ]

