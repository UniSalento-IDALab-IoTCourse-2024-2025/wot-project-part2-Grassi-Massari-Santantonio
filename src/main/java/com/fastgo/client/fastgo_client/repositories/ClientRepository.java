package com.fastgo.client.fastgo_client.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.fastgo.client.fastgo_client.domain.Client;

public interface ClientRepository extends MongoRepository<Client, String> {

    
} 
