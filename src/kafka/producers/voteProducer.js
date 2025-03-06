const {Kafka} = require("kafkajs");

class VoteProducer{
    constructor(){
        this.kafka = new Kafka({
            clientId: "vote-producer",
            brokers : [process.env.KAFKA_BOOTSTRAP_SERVER || 'localhost:9092']
        });

        this.producer = this.kafka.producer();
        this.isConnected = false;
    }

    async connect(){
        if(!this.isConnected){
            await this.producer.connect();
            this.isConnected = true;
            console.log("Vote producer connected to kafka");
        }
    }

    async sendVote(pollId, optionId, userId='anonymous'){
        try{
            await this.connect();

            const message = {
                pollId,
                optionId,
                userId,
                timestamp : new Date().toString()
            };

            await this.producer.send({
                topic:'poll-votes',
                messages : [
                    {
                        key:pollId,
                        value:JSON.stringify(message)
                    }
                ]
            });

            console.log(`Vote sent to Kafka: Poll ${pollId}, Option ${optionId}`);
            return true;
        }catch(err){
            console.error("error sending vote to kafka: " + err);
            throw err;
        }
    }

    async disconnect(){
        if(this.isConnected){
            await this.producer.disconnect();
            this.isConnected = false;
        }
    }
}

module.exports = new VoteProducer();