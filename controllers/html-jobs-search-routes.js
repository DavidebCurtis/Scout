const router = require("express").Router();
const sequelize = require("../config/connection");
const { Job, Pets, Owner } = require("../models");

// this just calls all jobs on page load and stores it in the jobs variable to use in handlebars
router.get("/", (req, res) => {
  Job.findAll({
    order: [["timeframe", "ASC"]],
    where: {
      walker_id: null,
    },
    include: [
      {
        model: Pets,
        attributes: ["pet_name", "pet_type", "description", "owner_id"],
      },
      {
        model: Owner,
        attributes: ["first_name", "last_name", "is_owner"],
      },
    ],
  }).then((dbJobData) => {
    const jobs = dbJobData.map((job) => job.get({ plain: true }));
    res.render("jobsearch", {
      jobs,
      loggedIn: req.session.loggedIn,
      owner_id: req.session.user_id,
      isWalker: req.session.isWalker,
    });
  });
});

module.exports = router;
