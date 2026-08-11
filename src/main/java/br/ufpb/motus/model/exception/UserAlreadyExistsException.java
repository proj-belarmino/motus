package br.ufpb.motus.model.exception;

public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(String email) {
        super(String.format("An account with email '%s' already exists.", email));
    }
}