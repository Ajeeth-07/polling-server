const express = require("express");
const router = express.Router();
const pollRepository = require("../db/repositories/pollRepository");

router.get("/", async(req,res) => {
    try{
        const limit = parseInt(req.query.limit) || 5;
        const topPolls = await pollRepository.getTopPolls(limit);

        res.json({
            leaderboard: topPolls.map(poll => ({
                id:poll.id,
                title:poll.title,
                totalVotes:poll.getTotalVotes(),
                topOption : poll.options.sort((a,b) => b.votes - a.votes)[0]
            }))
        });
    }catch(err){
        console.error("error fetching leaderboard", err);
        res.status(500).json({error:"Internal server error"})
    }
});

module.exports = router;