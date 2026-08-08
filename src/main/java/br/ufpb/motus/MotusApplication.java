package br.ufpb.motus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

// Desativamos temporariamente a segurança padrão do Spring Security para facilitar o teste no navegador
@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
public class MotusApplication {
    public static void main(String[] args) {
        SpringApplication.run(MotusApplication.class, args);
    }
}