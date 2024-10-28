for prod run 'npm run dockerprod'
is starts server at docker

to launch dev
start:
npm run dockerdev

and write to .env 
NEXT_PUBLIC_MONGODB_URI=mongodb://root:example@localhost:27017/chatDatabase?authSource=admin
JWT_SECRET=*some random key*
npm run serverstart
and
npm run dev
must launch 2 terminals at one time
client launched at http://localhost:3000/