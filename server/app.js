const express = require("express"),
    path = require("path"),
    morgan = require("morgan"),
    helmet = require("helmet"),
    yup = require("yup"),
    monk = require("monk"),
    firebase = require("firebase/app")

require("dotenv").config();


const firebaseConfig = {

  };

firebase.initializeApp(firebaseConfig)

const database = firebase.database();

let writeUserData = (urlInfo) => {
    database.ref('urls/' + urlInfo.slug).set(urlInfo)
}

const { customAlphabet, urlAlphabet } = require("nanoid");

const db = monk(process.env.MONGODB_URI);
const urls = db.get("urls");
urls.createIndex({ slug: 1 }, { unique: true });

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
        const url = await urls.findOne({ slug });

        if (url) {
            res.redirect(301, url.url);
        }
        res.status(404).sendFile(notFoundPath)
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
                existing = await urls.findOne({ slug });
            } while (existing);
        } else {
            const existing = await urls.findOne({ slug });
            if (existing) {
                throw new Error("Slug in use.");
            }
        }
        slug = slug.toLowerCase();

        const newUrl = {
            url,
            slug,
        };

        // const createdUrl = await urls.insert(newUrl);
        



        res.json(createdUrl);
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
