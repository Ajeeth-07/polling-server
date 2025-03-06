const {Kafka} = require("kafkajs");
const pollRepository = require("../../db/repositories/pollRepository");
const WebSocketManager = require("../../websocket/wsManager");
const { poll } = require("../../db/client");

class VoteConsumer {
    constructor(){
        this.kafka = new Kafka({
            clientId: 'vote-consumer',
            brokers: [process.env.KAFKA_BOOTSTRAP_SERVER || 'localhost":9092']
        });

        this.consumer = this.kafka.consumer({groupId: 'poll-vote-processors'});
        this.isConnected = false;
    }

    async connect(){
        if(!this.isConnected){
            await this.consumer.connect();
            await this.consumer.subscribe({topic:'poll-votes', fromBeginning:false});
            this.isConnected = true;
            console.log('Vote consumer connected to kafka');
        }
    }

    async startConsuming(){
        try{
            await this.connect();

            await this.consumer.run({
                eachMessage: async({topic, partition, message}) => {
                    try{
                        const voteData = JSON.parse(message.value.toString());
                        console.log(`Processing Vote from partition ${partition}:`, voteData);

                        //update poll in repo
                        const success = await pollRepository.updateVote(voteData.pollId, voteData.optionId);

                        if(success){
                            //get updated poll data
                            const updatedPoll = await pollRepository.findById(voteData.pollId);

                            //broadcast to websocket
                            if(updatedPoll){
                                WebSocketManager.broadcastPollUpdate(updatedPoll);
                            }
                        }
                    }catch(err){
                        console.error("Error processing vote message " + err);
                    }
                }
            });

            console.log("Vote consumer started");
        }catch(err){
            console.error("error starting vote consumer:", err);
            throw err;
        }
    }

    async disconnect(){
        if(this.isConnected){
            await this.consumer.disconnect();
            this.isConnected = false;
        }
    }
}

module.exports = new VoteConsumer();