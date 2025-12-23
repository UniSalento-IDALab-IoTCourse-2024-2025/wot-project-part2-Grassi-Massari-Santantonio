package com.fastgo.client.fastgo_client.service;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import com.fastgo.client.fastgo_client.domain.Client;
import com.fastgo.client.fastgo_client.dto.ClientDto;
import com.fastgo.client.fastgo_client.dto.ProfilePictureDto;
import com.fastgo.client.fastgo_client.repositories.ClientRepository;
import com.fastgo.client.fastgo_client.security.JwtUtilities;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ClientService {
    
    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private JwtUtilities jwtUtilities;

    private static final Logger log = LoggerFactory.getLogger(ClientService.class);

     public boolean isClientTokenValid(String token) {
        return jwtUtilities.hasRoleClient(token);
    }

    public boolean doesClientExist(String riderId) {
        return clientRepository.existsById(riderId);
    }

    public Client getClientFromToken(String token) {
        String Username = jwtUtilities.extractUsername(token);
        
        Optional<Client> client = clientRepository.findByUsername(Username);
        if (client.isPresent()) {
            return client.get();
        }

        return null;
        
    }



     public String saveClientFromDto(ClientDto clientDto) {
        
        try {
            Client client = new Client();
            client.setId(clientDto.getId());
            client.setUsername(clientDto.getUsername());
            client.setName(clientDto.getName());
            client.setLastName(clientDto.getLastName());
            client.setEmail(clientDto.getEmail());
            client.setPictureUrl(clientDto.getPictureUrl());

            clientRepository.save(client);
            log.info("SALVATAGGIO RIUSCITO.");

            return "OK";

        } catch (DataAccessException e) {
            log.error("Database error while saving Rider ID: {}. Details: {}", clientDto.getId(), e.getMessage());
            return "ERROR: DB_SAVE_FAILED"; 

        } catch (Exception e) {
            log.error("Unexpected error while saving Rider ID: {}", clientDto.getId(), e);
            return "ERROR: UNEXPECTED_FAILURE";
        }
    }

    public String getClientIdFromToken(String token) {
        return jwtUtilities.extractUserId(token);
    }

    public ProfilePictureDto getRiderProfilePicure(String clientId) {
         Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new RuntimeException("Client not found with id: " + clientId));
    ProfilePictureDto dto = new ProfilePictureDto();
    dto.setProfilePicture(client.getPictureUrl());
    return dto;
    }
}
