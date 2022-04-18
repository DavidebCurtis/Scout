const router = require("express").Router();
const sequelize = require("../config/connection");
const withAuth = require("../utils/auth");
const { Walker, Owner, Job, Pets } = require("../models");

// gets all the jobs by owner ID on page load and stores them in the jobs variable to use in handlebars
router.get("/", (req, res) => {
  const id = req.session.user_id;
  console.log(req.session);

  if (req.session.isWalker) {
    Job.findAll({
      order: [["timeframe", "ASC"]],
      where: {
        walker_id: id,
      },
      include: [
        {
          model: Pets,
          attributes: ["id", "pet_name", "pet_type", "description", "owner_id"],
        },
        {
          model: Owner,
          attributes: ["first_name", "last_name"],
        },
      ],
    }).then((dbJobData) => {
      const jobsClean = dbJobData.map((job) => job.get({ plain: true }));
      let jobs = jobsClean.filter((job) => job.completed == false);

      const completedJobsClean = dbJobData.map((job) =>
        job.get({ plain: true })
      );
      let completedJobs = completedJobsClean.filter(
        (job) => job.completed == true
      );

      Pets.findAll({
        where: {
          owner_id: id,
        },
      }).then((dbPetData) => {
        const ownersPets = dbPetData.map((pets) => pets.get({ plain: true }));
        // console.log(ownersPets);
        res.render("dashboard", {
          jobs,
          ownersPets,
          completedJobs,
          loggedIn: req.session.loggedIn,
          walker_id: req.session.user_id,
          isWalker: req.session.isWalker,
          isOwner: req.session.isOwner,
        });
      });
    });
  }

  if (req.session.isOwner) {
    Job.findAll({
      order: [["timeframe", "ASC"]],
      where: {
        owner_id: id,
        // completed: false,
      },
      include: [
        {
          model: Pets,
          attributes: ["id", "pet_name", "pet_type", "description", "owner_id"],
        },
        {
          model: Owner,
          attributes: ["first_name", "last_name"],
        },
      ],
    }).then((dbJobData) => {
      const jobsClean = dbJobData.map((job) => job.get({ plain: true }));
      let jobs = jobsClean.filter((job) => job.completed == false);

      const completedJobsClean = dbJobData.map((job) =>
        job.get({ plain: true })
      );
      let completedJobs = completedJobsClean.filter(
        (job) => job.completed == true
      );

      Pets.findAll({
        where: {
          owner_id: id,
        },
      }).then((dbPetData) => {
        const ownersPets = dbPetData.map((pets) => pets.get({ plain: true }));
        // console.log(ownersPets);
        res.render("dashboard", {
          jobs,
          ownersPets,
          completedJobs,
          loggedIn: req.session.loggedIn,
          owner_id: req.session.user_id,
          isWalker: req.session.isWalker,
          isOwner: req.session.isOwner,
        });
      });
    });
  }
});

// Path to edit page where user can edit or delete a post
router.get("/edit/:id", withAuth, (req, res) => {
  Post.findOne({
    where: {
      // use the ID from url parameters
      id: req.params.id,
    },
    attributes: ["id", "post_contents", "title", "created_at"],
    include: [
      {
        model: Comment,
        attributes: [
          "id",
          "comment_contents",
          "post_id",
          "user_id",
          "created_at",
        ],
        include: {
          model: User,
          attributes: ["username"],
        },
      },
      {
        model: User,
        attributes: ["username"],
      },
    ],
  })
    .then((dbPostData) => {
      if (!dbPostData) {
        res.status(404).json({ message: "No post found with this id" });
        return;
      }
      // serialize data before passing to template
      const post = dbPostData.get({ plain: true });
      res.render("edit-post", {
        post,
        loggedIn: true,
        username: req.session.username,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// Path to create a post HTML page
router.get("/create-post", withAuth, (req, res) => {
  res.render("create-post", { loggedIn: true, username: req.session.username });
  return;
});

module.exports = router;
