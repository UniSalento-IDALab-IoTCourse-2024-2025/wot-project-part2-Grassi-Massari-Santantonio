package com.fastgo.client.fastgo_client.component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fastgo.client.fastgo_client.dto.*;
import com.fastgo.client.fastgo_client.service.ClientService;



@Component
public class SyncListener {

    @Autowired
    ClientService clientService;

    private static final Logger log = LoggerFactory.getLogger(SyncListener.class);

   
    @RabbitListener(queues = "client.sync.request.queue")
    public String handleClientSyncRequest(SyncClientDto clientDto) {
        
        //stampa il JSON (toString() del DTO)
        log.info("Richiesta di sincronizzazione ricevuta per: {}", clientDto.getClientDto().toString());

         if (!clientService.isClientTokenValid(clientDto.getToken())) {
            return "ERROR: Unauthorized - Invalid Client Token";
        }

        if (clientService.doesClientExist(clientDto.getClientDto().getId())){
            return "ERROR: Client already exists";
        }
       
        return clientService.saveClientFromDto(clientDto.getClientDto());
    }
}