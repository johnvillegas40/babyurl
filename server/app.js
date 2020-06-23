const express = require("express"),
    cors = require("cors"),
    morgan = require("morgan"),
    helmet = require("helmet"),
    yup = require("yup"),
    monk = require("monk");

require("dotenv").config();

const { customAlphabet, urlAlphabet } = require("nanoid");

const db = monk(process.env.MONGODB_URI);
const urls = db.get("urls");
urls.createIndex("slug");

const app = express();

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

// Redirect based on the slug
app.get("/:id", async (req, res) => {
    const { id: slug } = req.params;

    try {
        const url = await urls.findOne({ slug });

        if (url) {
            res.redirect(301, url.url);
        }
        res.redirect(`/?error=${slug} not found`)
    } catch (error) {
        res.redirect(`/?error=Link not found`)
    }
});

// create the schema of the object using yup
const schema = yup.object().shape({
    slug: yup
        .string()
        .trim()
        .matches(/[\w\-]/i),
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

        const createdUrl = await urls.insert(newUrl);

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
