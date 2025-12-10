package com.fastgo.client.fastgo_client.component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.fastgo.client.fastgo_client.dto.*;



@Component
public class SyncListener {

    private static final Logger log = LoggerFactory.getLogger(SyncListener.class);

   
    @RabbitListener(queues = "client.sync.request.queue")
    public String handleClientSyncRequest(ClientDto clientDto) {
        
        //stampa il JSON (toString() del DTO)
        log.info("Richiesta di sincronizzazione ricevuta per: {}", clientDto.toString());

       
        return "OK";
    }
}