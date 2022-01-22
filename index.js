const express = require("express");
const app = express();
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const upload = multer({ dest: "uploads/" });
const mongoose = require("mongoose");

require("dotenv").config();

app.use(express.json());

//passport
const secrettoken = "allow";

const passport = require("passport");

const { UniqueTokenStrategy } = require("passport-unique-token");

passport.use(
  new UniqueTokenStrategy((token, done) => {
    if (token == secrettoken) done(null, "user");
    else {
      done(null, false);
    }
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {});
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.use(passport.initialize());

//model
const Omicrondaily = mongoose.model("Omicrondaily", {
  location: String,
  date: Date,
  variant: String,
  num_sequences: Number,
  perc_sequences: String,
  num_sequences_total: Number,
});

//upload csv
app.post("/csv", upload.single("myfile"), (req, res) => {
  //reading csv file and pipe to csv parser
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => {
      console.log(data);

      //creating model instance
      const omicrondaily = new Omicrondaily({
        location: data.location,
        date: new Date(data.date),
        variant: data.variant,
        num_sequences: Number(data.num_sequences),
        perc_sequences: data.perc_sequences,
        num_sequences_total: Number(data.num_sequences_total),
      });

      //saving
      omicrondaily.save().then(() => console.log("saved"));
    })
    .on("end", () => {
      console.log("end........");
      res.send("complete");
    });
});

// Read
app.get(
  "/api/getall",

  passport.authenticate("token", {
    failureRedirect: "/error",
  }),

  async (req, res) => {
    const alldocs = await Omicrondaily.find({});
    res.json(alldocs);
  }
);

// Create
app.post(
  "/api/create",
  passport.authenticate("token", {
    failureRedirect: "/error",
  }),
  async (req, res) => {
    const omicrondaily = new Omicrondaily({ ...req.body });
    console.log(omicrondaily);
    omicrondaily.save().then(() => console.log("saved"));
    res.json({ msg: "created" });
  }
);

//update
app.put(
  "/api/update/:id",
  passport.authenticate("token", {
    failureRedirect: "/error",
  }),
  async (req, res) => {
    const id = req.params.id;
    await Omicrondaily.findByIdAndUpdate(id, { ...req.body });
    const updated = await Omicrondaily.findById(id);
    res.json(updated);
  }
);
//delete
app.delete(
  "/api/delete/:id",
  passport.authenticate("token", {
    failureRedirect: "/error",
  }),
  async (req, res) => {
    const id = req.params.id;
    const deleted = await Omicrondaily.findByIdAndDelete(id);
    res.json(deleted || "not in collection");
  }
);

app.use("/error", (req, res) => {
  res.json({ msg: "not allowed" });
});
app.get('/',(req,res)=>{
  res.send('Welcome')
})
//connecting to db
mongoose.connect(process.env.MONGO_URL, () => {
  console.log("connected to db");
  app.listen(process.env.PORT || 3000);
});
