package com.fastgo.client.fastgo_client.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.fastgo.client.fastgo_client.domain.Client;

@Repository
public interface ClientRepository extends MongoRepository<Client, String> {

    Optional<Client> findByUsername(String username);
} 
