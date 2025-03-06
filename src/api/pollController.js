const express = require("express");
const router = express.Router();
const pollRepository = require("../db/repositories/pollRepository");
const voteProducer = require("../kafka/producers/voteProducer");

//creating new poll
router.post("/", async(req, res) => {
    try{
        const {title, options} = req.body;

        //validation
        if(!title || !options || !Array.isArray(options) || options.length < 2){
            return res.status(400).json({
                error : "Poll must have atleast 2 options"
            });
        }

        const poll = await pollRepository.create(title, options);
        res.status(201).json(poll);
    }catch(err){
        console.error(err);
    }
});

//get poll by id
router.get("/:id", async(req,res) => {
    try{
        const poll = await pollRepository.findById(req.params.id);

        if(!poll){
            return res.status(404).json({error : "no poll found"});
        }

        res.json(poll);
    }catch(err){
        console.error('Error fetching poll:', err);
        res.status(500).json({error : "Internal server error"});
    }
});

//vote on a poll
router.post("/:id/vote", async(req,res) => {
    try{
        const {optionId} = req.body;
        const pollId = req.params.id;

        //validation
        if(!optionId){
            return res.status(200).json({error:"Option id is required"})
        }

        const poll = await pollRepository.findById(pollId);
        if(!poll) return res.status(404).json({error:"No poll found"});

        //send vote to kafka
        await voteProducer.sendVote(pollId, optionId);

        res.json({
            message:"Vote submitted successfully",
            pollId,
            optionId
        });
    }catch(err){
        console.error("error processing vote", err);
        res.status(500).json({error : "Internal server error"});
    }
});

//get all polls
router.get("/", async(req, res) => {
    try{
        const polls = await pollRepository.getAllPolls();
        res.json(polls);
    }catch(err){
        console.error("Error fetching polls:", err);
        res.status(500).json({error:"Internal server error"})
    }
});

module.exports = router;