const router = require("express").Router();
const withAuth = require("../../utils/auth");
const { Walker, Owner, Job, Pets } = require("../../models");
const uniqid = require("uniqid");
const nodemailer = require("nodemailer");

//  route coming into file is https://pacific-depths-79804.herokuapp.com/api/walker

// GET all walkers
router.get("/", (req, res) => {
  // Access our Walker model and run .findAll() method)
  Walker.findAll({
    attributes: { exclude: ["password"] },
  })
    .then((dbWalkerData) => res.json(dbWalkerData))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get("/walkerid", (req, res) => {
  console.log(req.session.loggedIn);
  // Access our Walker model and run .findAll() method)
  if (req.session.loggedIn) {
    console.log(req.session.user_id);
    return res.json({ walkerId: req.session.user_id });
  } else {
    res.status(404).end();
  }
});

// GET one walker
router.get("/:id", (req, res) => {
  Walker.findOne({
    attributes: { exclude: ["password"] },
    include: [
      {
        model: Job,
        attributes: [
          "id",
          "pay",
          "check_in",
          "walk",
          "timeframe",
          "location",
          "completed",
          "owner_id",
          "animal_id",
        ],
      },
    ],
    where: {
      id: req.params.id,
    },
  })
    .then((dbWalkerData) => {
      if (!dbWalkerData) {
        res.status(404).json({ message: "No walker found with this id" });
        return;
      }
      res.json(dbWalkerData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// POST /api/walker (used to create a walker on signup)
router.post("/", (req, res) => {
  let transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 25,
    secure: false,
    auth: {
      user: "scoutpetwalks@outlook.com",
      pass: process.env.EMAIL_PW,
    },
    tls: {
      rejectUnuthorized: false,
    },
  });

  // send mail with defined transport object
  let info = transporter.sendMail({
    from: '"Scout" <scoutpetwalks@outlook.com',
    to: req.body.email,
    subject: "Scout sign up",
    text: "Thank you for signing up for Scout!",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // expects {id: 'xxxxx' first_name: 'xxxx', last_name: 'xxxx', email: 'xxxxxx', password: 'xxxxx'}
  Walker.create({
    id: uniqid(),
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
  })
    .then((dbWalkerData) => {
      req.session.save(() => {
        req.session.user_id = dbWalkerData.id;
        req.session.email = dbWalkerData.email;
        req.session.loggedIn = true;
        req.session.isWalker = true;
        req.session.isOwner = false;

        res.json(dbWalkerData);
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// POST /api/walkers/login
router.post("/login", (req, res) => {
  Walker.findOne({
    where: {
      email: req.body.email,
    },
  }).then((dbWalkerData) => {
    if (!dbWalkerData) {
      res.status(400).json({ message: "No walker with that email address!" });
      return;
    }

    const validPassword = dbWalkerData.checkPassword(req.body.password);

    if (!validPassword) {
      res.status(400).json({ message: "Incorrect password!" });
      return;
    }
    req.session.save(() => {
      // declare session variables
      req.session.user_id = dbWalkerData.id;
      req.session.email = dbWalkerData.email;
      req.session.loggedIn = true;
      req.session.isWalker = true;
      req.session.isOwner = false;

      res.json({ user: dbWalkerData, message: "You are now logged in!" });
    });
  });
});

// POST /api/walkers/logout
router.post("/logout", (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

// PUT /api/walker/1
router.put("/:id", (req, res) => {
  // if req.body has exact key/value pairs to match the model, you can just use `req.body` instead
  Walker.update(req.body, {
    individualHooks: true,
    where: {
      id: req.params.id,
    },
  })
    .then((dbWalkerData) => {
      if (!dbWalkerData[0]) {
        res.status(404).json({ message: "No walker found with this id" });
        return;
      }
      res.json(dbWalkerData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// DELETE /api/walker/1
router.delete("/:id", (req, res) => {
  Walker.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((dbWalkerData) => {
      if (!dbWalkerData) {
        res.status(404).json({ message: "No walker found with this id" });
        return;
      }
      res.json(dbWalkerData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
