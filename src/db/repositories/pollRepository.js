const { v4: uuidv4 } = require('uuid');
const prisma = require('../client');
const PollModel = require('../../models/Poll'); // Original Poll class for business logic

class PollRepository {
  async create(title, options) {
    const pollOptions = options.map((text, index) => ({
      id: `option-${index + 1}`,
      text,
      votes: 0
    }));

    const poll = await prisma.poll.create({
      data: {
        title,
        options: pollOptions
      }
    });

    // Return as domain model
    return new PollModel(
      poll.id,
      poll.title,
      poll.options,
      poll.createdAt
    );
  }

  async findById(id) {
    const poll = await prisma.poll.findUnique({
      where: { id }
    });
    
    if (!poll) return null;

    // Get votes for this poll
    const votes = await prisma.vote.groupBy({
      by: ['optionId'],
      where: { pollId: id },
      _count: { id: true }
    });

    // Update vote counts in options
    const options = poll.options.map(option => {
      const voteData = votes.find(v => v.optionId === option.id);
      return {
        ...option,
        votes: voteData ? voteData._count.id : 0
      };
    });

    // Return as domain model
    return new PollModel(
      poll.id,
      poll.title,
      options,
      poll.createdAt
    );
  }

  async updateVote(pollId, optionId) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });
    
    if (!poll) return false;

    //validation of option
    const options = poll.options;
    const validOption = options.some(opt => opt.id === optionId);
    if(!validOption){
        console.warn(`Attempted to vote with invalid option ${optionId} for poll: ${pollId}`);
        return false;
    }

    // Add vote record
    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        userId: 'anonymous' // In a real app, use actual user ID
      }
    });

    return true;
  }

  async getAllPolls() {
    const polls = await prisma.poll.findMany();
    
    // Create domain models with vote counts
    return Promise.all(
      polls.map(async poll => {
        const votes = await prisma.vote.groupBy({
          by: ['optionId'],
          where: { pollId: poll.id },
          _count: { id: true }
        });

        const options = poll.options.map(option => {
          const voteData = votes.find(v => v.optionId === option.id);
          return {
            ...option,
            votes: voteData ? voteData._count.id : 0
          };
        });

        return new PollModel(
          poll.id,
          poll.title,
          options,
          poll.createdAt
        );
      })
    );
  }

  async getTopPolls(limit = 5) {
    // Get polls with vote counts
    const polls = await prisma.$queryRaw`
      SELECT p.id, p.title, p."createdAt", COUNT(v.id) as vote_count
      FROM "Poll" p
      LEFT JOIN "Vote" v ON p.id = v."pollId"
      GROUP BY p.id, p.title, p."createdAt"
      ORDER BY vote_count DESC
      LIMIT ${limit}
    `;
    
    // Fetch full data for each poll
    return Promise.all(
      polls.map(async poll => this.findById(poll.id))
    );
  }
}

module.exports = new PollRepository();