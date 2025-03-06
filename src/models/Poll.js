class Poll {
  constructor(id, title, options, createdAt = new Date()) {
    this.id = id;
    this.title = title;
    this.options = options.map(option => ({
      id: option.id,
      text: option.text,
      votes: option.votes || 0
    }));
    this.createdAt = createdAt;
  }
  
  addVote(optionId) {
    const option = this.options.find(opt => opt.id === optionId);
    if (option) {
      option.votes += 1;
      return true;
    }
    return false;
  }
  
  getTotalVotes() {
    return this.options.reduce((sum, option) => sum + option.votes, 0);
  }
  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      options: this.options,
      totalVotes: this.getTotalVotes(),
      createdAt: this.createdAt
    };
  }
}

module.exports = Poll;