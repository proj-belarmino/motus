package br.ufpb.motus.model.exception;

import lombok.Getter;

@Getter
public class InvalidRangeRequestException extends RuntimeException {
    private final String rangeHeader;
    private final long fileSize;

    public InvalidRangeRequestException(String rangeHeader, long fileSize) {
        super(String.format("Invalid range request '%s' for file of size %d.", rangeHeader, fileSize));
        this.rangeHeader = rangeHeader;
        this.fileSize = fileSize;
    }

}