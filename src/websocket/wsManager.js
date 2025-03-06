const WebSocket = require("ws");

class WebSocketManager {
    constructor(){
        this.clients = new Map()  //map pollId => set of clients
    }

    init(server){
        this.wss = new WebSocket.Server({server});

        this.wss.on('connection', (ws, req) => {
            console.log('New websocket connection');

            //extracting pollId from url if present
            const url = new URL(req.url, 'http://localhost');
            const pollId = url.searchParams.get('pollId');

            if(pollId){
                //client for specific poll updates
                if(!this.clients.has(pollId)){
                    this.clients.set(pollId, new Set());
                }
                this.clients.get(pollId).add(ws);

                console.log(`Client subscribed to pill: ${pollId}`);

                ws.on('close', () => {
                    if(this.clients.has(pollId)){
                        this.clients.get(pollId).delete(ws);
                        if(this.clients.get(pollId).size === 0){
                            this.clients.delete(pollId);
                        }
                    }
                    console.log(`Client unsubscribed from poll: ${pollId}`);
                });
            }else{
                //leaderboard updates
                if(!this.clients.has('leaderboard')){
                    this.clients.set('leaderboard', new Set());
                }
                this.clients.get('leaderboard').add(ws);

                console.log('Client subscribed to leaderboard');

                ws.on('close', () => {
                    if(this.clients.has('leaderboard')){
                        this.clients.get('leaderboard').delete(ws);
                    }
                    console.log('Client unsubscribed from leaderboard');
                });
            }
        });

        console.log('Websocket server initialised');
    }

    broadcastPollUpdate(poll){
        const pollId = poll.id;
        const clients = this.clients.get(pollId);

        if(clients && clients.size > 0){
            const message = JSON.stringify({
                type: 'POLL_UPDATE',
                data : poll 
            });

            clients.forEach(client => {
                if(client.readyState === WebSocket.OPEN){
                    client.send(message);
                }
            });

            console.log(`Broadcasted update for poll ${pollId} to ${clients.size} clients`);
        }

        //update leaderboard
        this.updateLeaderboard();
    }

    async updateLeaderboard(){
        const leaderboardClients = this.clients.get('leaderboard');

        if(leaderboardClients && leaderboardClients.size > 0){
            try{
                const pollRepository = require("../db/repositories/pollRepository");
                const topPolls = await pollRepository.getTopPolls(5);

                const message = JSON.stringify({
                    type: 'LEADERBOARD_UPDATE',
                    data: topPolls
                });

                leaderboardClients.forEach(client => {
                    if(client.readyState === WebSocket.OPEN){
                        client.send(message);
                    }
                });

                console.log(`Leaderboard broadcasted to ${leaderboardClients.size} clients`);
            }catch(err){
                console.error('Error updating leaderboard:', err);
            }
        }
    }
}

module.exports = new WebSocketManager();