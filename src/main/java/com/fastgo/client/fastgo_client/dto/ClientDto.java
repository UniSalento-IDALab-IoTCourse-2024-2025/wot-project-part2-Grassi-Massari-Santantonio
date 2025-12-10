package com.fastgo.client.fastgo_client.dto;

import com.fastgo.client.fastgo_client.domain.Role;
import com.fastgo.client.fastgo_client.domain.State;

public class ClientDto {
    
    private String id;
    private String name;
    private String lastName;
    private String username;
    private String password;
    private String email;
    private State status;
    private Role role = Role.USER;   
    private String pictureUrl;
    
    // Getters and Setters
    public String getId() {   
        return id;
    }                   
    public void setId(String id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public State getStatus() {
        return status;
    }
    public void setStatus(State status) {
        this.status = status;
    }
    public Role getRole() {
        return role;
    }
    public String getPictureUrl() {
        return pictureUrl;
    }
    public void setPictureUrl(String pictureUrl) {
        this.pictureUrl = pictureUrl;
    }

}