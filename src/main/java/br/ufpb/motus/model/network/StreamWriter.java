package br.ufpb.motus.model.network;

import java.io.IOException;
import java.io.OutputStream;

@FunctionalInterface
public interface StreamWriter {
    void writeTo(OutputStream output) throws IOException;
}