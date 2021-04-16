import { Inject } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Producer } from '@nestjs/microservices/external/kafka.interface';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io'

@WebSocketGateway()
export class RoutesGateway implements OnModuleInit {

  private kafkaProducer: Producer;

  @WebSocketServer()
  server: Server

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka) {

  }

  async onModuleInit() {
		this.kafkaProducer = await this.kafkaClient.connect();
	}

  @SubscribeMessage('new-direction')
  handleMessage(client: Socket, payload: { routeId: string }) {
    this.kafkaProducer.send({
      topic:process.env.KAFKA_PRODUCER_TOPIC,
      messages:[
        {
          key:process.env.KAFKA_PRODUCER_TOPIC,
          value:JSON.stringify({
            'routeId': payload.routeId,
            'clientId':client.id
          })
        }
      ]
    })
    console.log(payload)
  }

  sendPosition(data:{
    routeId:string, 
    clientId:string ,
    position:[number, number],
    finished: boolean}) {


    const {clientId,...rest} = data;
    const clients = this.server.sockets.connected;
    console.log(rest)
    if(!(clientId in clients)) {
      console.error('Client not exists')
      return
    }
    
    clients[clientId].emit('new-position', rest)

  }
}
