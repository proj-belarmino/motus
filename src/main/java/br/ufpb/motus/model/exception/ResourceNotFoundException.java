package br.ufpb.motus.model.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {
    private final String resourceType;
    private final String resourceId;

    public ResourceNotFoundException(String resourceType, String resourceId) {
        super(String.format("%s with identifier '%s' could not be found.", resourceType, resourceId));
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

}