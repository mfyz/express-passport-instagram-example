# express-passport-instagram-example

### Set up posgres

1. heroku addons:create heroku-postgresql:hobby-dev
2. heroku config
3. Copy the POSTGRES_URL to .env file
4. Connect to db and import the users table in db.sql file

## Set up Instagram Application

1. Create or use existing IG app from developer portal
2. Copy app id and secret to environment variables
  i. Put env variables in .env file
  ii. Set up deployment (heroku in this example) env variables
3. Set up redirect urls in the app in InstagramStrategy object config
4. Add the callback urls to instagram app's whitelisted redirect urls

### Run

1. npm install
2. node index.js

### Deploy on heroku

1. git init
2. heroku login
3. heroku create
4. git push heroku master

Note: You may get blocked url when /auth/instagram redirects to instagram's oauth pages due to Instagram's blocks on heroku IP addresses. If you see this, the heroku instance you deployed will not be able to work with Instagram oauth. Deploy somewhere else or use outboud proxy services like Proximo on heroku instance to solve this issue.
