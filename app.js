const express = require("express"),
    path = require("path"),
    morgan = require("morgan"),
    helmet = require("helmet"),
    yup = require("yup"),
    firebase = require("firebase/app")

require("dotenv").config();
require("firebase/database")

const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.DOMAIN,
    databaseURL: process.env.DBURL,
    projectId: "babyurl",
    storageBucket: process.env.BUCKET,
    messagingSenderId: process.env.SENDERID,
    appId: process.env.APPID,
    measurementId: process.env.MEASUREMENT
  };

firebase.initializeApp(firebaseConfig)

const database = firebase.database();

let writeUserData = async (urlInfo) => {
    database.ref('urls/' + urlInfo.slug).set(urlInfo)
}

const { customAlphabet, urlAlphabet } = require("nanoid");


const app = express();
app.enable('trust proxy');

app.use(helmet());
app.use(morgan("common"));
app.use(express.json());
app.use(express.static("./public"));

const notFoundPath = path.join(__dirname, 'public/404.html');

// Redirect based on the slug
app.get("/:id", async (req, res) => {
    const { id: slug } = req.params;

    try {
        const url = await database.ref('/urls/' + slug).once('value').then(function(snapshot) {
                    return snapshot.val()
                });
        if (url) {
            res.redirect(301, url.url);
        } else {
            res.status(404).sendFile(notFoundPath)
        }
        
    } catch (error) {
        res.status(404).sendFile(notFoundPath)
    }
});

// create the schema of the object using yup
const schema = yup.object().shape({
    slug: yup.string().trim().matches(/^[\w\-]+$/i),
    url: yup.string().trim().url().required(),
  });

// creating the shortened link

app.post("/url", async (req, res, next) => {
    let { slug, url } = req.body;

    if (!url.includes("http://") && !url.includes("https://")) {
        url = "http://" + url;
    }

    try {
        await schema.validate({
            slug,
            url,
        });
        if (!slug) {
            let existing = null;
            do {
                slug = customAlphabet(urlAlphabet, 6)();
                existing = await database.ref('/urls/' + slug).once('value').then(function(snapshot) {
                    return snapshot.val()
                  });
                console.log(existing)
            } while (existing);
        } else {
            const existing = await database.ref('/urls/' + slug).once('value').then(function(snapshot) {
                return snapshot.val()
              });
            if (existing) {
                throw new Error("Slug in use.");
            }
        }
        slug = slug.toLowerCase();

        const newUrl = {
            url,
            slug,
        };

        


        const createdUrl = await writeUserData(newUrl)
        const jsonURL = JSON.stringify(newUrl)


        res.json(jsonURL);
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    if (error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === "production" ? "🐌" : error.stack,
    });
});

const port = process.env.PORT || 1211;

app.listen(port, () => {
    console.log(`Listening at ${port}`);
});
